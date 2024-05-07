/* eslint-disable no-undef */
/* eslint-disable max-len */
// * @NirmanSonawane

// const EVENT_TYPES = require("./Types");
import EVENT_TYPES from "./Types";
// import { ScrollMonitor } from "../EventMonitoring/ScrollMonitoring";
// import { generalEvents } from "../EventMonitoring/StepCompletionEventMonitoring";
const { EventEmitter } = require("events");
const activeApp = require("active-win");

/**
 * @param  {Number} interval - in millisec
 * @param {Object | String } stepApp - {app object} ||"all" use active-win module for getting stepApp info to monitor: {owner: {name: }, title: }
 * @param {Object} prevApp - previous step step app (needed for handling edge cases on mac while playing steps)
 * @param {String} mode - "strict/normal/watch"
 * @param {Boolean} monitorAppTitle -if strict or watch mode and monitorAppTile is enabled, app title will also be monitored along with other options in strict mode
 */
class ActiveAppMonitor extends EventEmitter {
	constructor({
		interval,
		stepApp,
		prevApp,
		startEvent = true,
		mode = "normal",
		monitorAppTitle = false,
		monitorScrollEvents = false,
		monitorClickEvents = false,
		watchSelfApp = true,
		// sendActiveAppLogs = false, // sends App Name, Window title, when there is a change;
	}) {
		super();
		this.interval = interval;
		this.targetState = "start";
		this.timeout = null;
		this.maxSimultaneousError = 1000;
		this.errCount = 0;
		this.step_app = mode === "watch" ? "all" : stepApp;
		this.mode = mode;
		this.prevEmitEvent = null;
		this.prevApp = prevApp || null;
		this.prevAppTitle = null;
		this.stepAppToMonitorInfo = null;
		this.startEvent = startEvent; // always emit first found event; // should be true for most of cases
		this.monitorAppTitle = monitorAppTitle; // * can only be used with strict mode
		this.monitorScrollEvents = monitorScrollEvents;
		this.scrollMonitor = null;
		this.clickMonitor = null;
		this.activateScrollListener = false;
		this.stepAppProcessInfo = null;
		this.monitorClickEvents = monitorClickEvents;
		this.watchSelfApp = watchSelfApp;
	}

	err(errorInfo) {
		log.error(`err in app monitor process ${errorInfo}, mode: ${this.mode} `);
		
		// if more than 5 simultaneous err occurs in getting active app we stop detection
		this.errCount++;
		if (this.maxSimultaneousError === this.errCount) {
			this.emitEvent(EVENT_TYPES.APP_MONITOR_ERR, { err: errorInfo });
			this.stop();
		}
	}

	emitEvent(event, data = {}) {
		this.errCount = 0;

		let whiteListEventsFromEmittingAgain = [EVENT_TYPES.APP_WINDOW_CHANGE, EVENT_TYPES.APP_TITLE_CHANGE, EVENT_TYPES.SCROLL_EVENT, EVENT_TYPES.CLICK_EVENT];

		if (event !== this.prevEmitEvent || whiteListEventsFromEmittingAgain.includes(event)) {
			this.startEvent = false;
			this.prevEmitEvent = event;

			const _emitData = {
				prevApp: this.stepAppToMonitorInfo,
				app: data,
			};

			this.emit(event, _emitData);
		}
	}

	isChangeInRange(val1, val2, range) {
		if (Math.abs(parseInt(val1) - parseInt(val2)) > range) {
			return true;
		}
		return false;
	}

	normalMode(shouldMonitorApp, app) {
		if (shouldMonitorApp) {
			this.emitEvent(EVENT_TYPES.APP_FOCUS, app);
		} else if (!this.isSelfApp(app) || this.startEvent) {
			this.emitEvent(EVENT_TYPES.APP_BLUR, app);
		}

		this.errCount = 0;
	}

	isAppSame(currentAppInfo) {
		try {
			const app1 = GmDC.getAppNameFromAppInfo(currentAppInfo);
			const app2 = GmDC.getAppNameFromAppInfo(this.stepAppToMonitorInfo);
			return app1 === app2;
		} catch (err) {
			log.error(err, currentAppInfo);
		}
	}

	isSelfApp(app) {
		if (app && app.owner) {
			return app.owner.name.replace(".exe", "").toLowerCase() == GmDC.selfName;
		}
		return false;
	}

	resetMonitoredApp() {
		this.stepAppToMonitorInfo = null;
	}

	isTitleChanged(currentAppInfo) {
		const currentTitle = this.getWinTitle(currentAppInfo);
		const prevTitle = this.getWinTitle(this.stepAppToMonitorInfo);

		const isTitleChanged = currentTitle !== prevTitle;

		return isTitleChanged && !!currentTitle;
	}

	isWindowChanged(currentWinInfo) {
		const currentWinId = currentWinInfo.handler;
		const prevWinId = this.stepAppToMonitorInfo.handler;
		const isWinChanged = currentWinId !== prevWinId;
		return isWinChanged;
	}

	isPosChanged(currentWininfo) {
		if (this.stepAppToMonitorInfo) {
			const prevWinBounds = this.stepAppToMonitorInfo.bounds;

			const { x: prev_x, y: prev_y, w: prev_w, h: prev_h } = prevWinBounds;
			const { x: new_x, y: new_y, w: new_w, h: new_h } = currentWininfo.bounds;
			const IGNORE_CHANGE_IN_POS_BY = EVENT_TYPES.allowedPosChange;

			const isXChanged = this.isChangeInRange(new_x, prev_x, IGNORE_CHANGE_IN_POS_BY);
			const isYChanged = this.isChangeInRange(new_y, prev_y, IGNORE_CHANGE_IN_POS_BY);
			const isWChanged = this.isChangeInRange(new_w, prev_w, IGNORE_CHANGE_IN_POS_BY);
			const isHChanged = this.isChangeInRange(new_h, prev_h, IGNORE_CHANGE_IN_POS_BY);

			if (isXChanged || isYChanged || isWChanged || isHChanged) {
				return true;
			}

			return false;
		}
	}

	strictMode(isStepAppInFocus, app) {
		let eventToEmit = null;

		this.monitorScrollEvents && this.scrollMonitor && this.scrollMonitor.start();
		this.monitorClickEvents && this.startClickMontitor();

		const EMIT_BLUR_EVENT = !isStepAppInFocus;
		const EMIT_FOCUS_EVENT = isStepAppInFocus && (this.prevEmitEvent === EVENT_TYPES.APP_BLUR || this.prevEmitEvent === null);

		if (EMIT_BLUR_EVENT) {
			eventToEmit = EVENT_TYPES.APP_BLUR;
		} else {
			if (EMIT_FOCUS_EVENT) {
				eventToEmit = EVENT_TYPES.APP_FOCUS;
			} else {
				const IS_TITLE_CHANGED = this.isTitleChanged(app);
				const IS_POS_CHANGED = this.isPosChanged(app);
				const IS_WINDOW_CHANGED = this.isWindowChanged(app);

				const EMIT_POS_FIX_EVENT = this.prevEmitEvent === EVENT_TYPES.APP_POS_CHANGE && !IS_POS_CHANGED;
				const EMIT_TITLE_CHANGE_EVENT = this.prevEmitEvent !== EVENT_TYPES.APP_WINDOW_CHANGE && IS_TITLE_CHANGED;

				if (IS_WINDOW_CHANGED) {
					eventToEmit = EVENT_TYPES.APP_WINDOW_CHANGE;
				} else if (EMIT_TITLE_CHANGE_EVENT && this.monitorAppTitle) {
					eventToEmit = EVENT_TYPES.APP_TITLE_CHANGE;
				} else if (IS_POS_CHANGED) {
					eventToEmit = EVENT_TYPES.APP_POS_CHANGE;
				} else if (EMIT_POS_FIX_EVENT) {
					eventToEmit = EVENT_TYPES.APP_POS_FIX;
				}
			}
		}

		eventToEmit && this.emitEvent(eventToEmit, app);
		this.updateAppToMonitorInfo(app);
	}

	updateAppToMonitorInfo(app) {
		this.stepAppToMonitorInfo = app;
	}

	async tick() {
		try {
			let app = await activeApp();

			if(app && app.owner)	{
				app.owner.name = app.owner.name.toLowerCase();
				app.owner.path = app.owner.path.toLowerCase();
			}

			const normalMode = (app) => {
				const isForegroundAppStepApp = this.isStepAppInFocus(app);
				if (!this.watchSelfApp) {
					if (!this.isSelfApp(app)) {
						return this.normalMode(isForegroundAppStepApp, app);
					}
				} else {
					return this.normalMode(isForegroundAppStepApp, app);
				}
			};

			const strictMode = (app) => {
				const isForegroundAppStepApp = this.isStepAppInFocus(app);

				if (!this.watchSelfApp) {
					if (!this.isSelfApp(app)) {
						return this.strictMode(isForegroundAppStepApp, app);
					} else {
						return false;
					}
				} else {
					return this.strictMode(isForegroundAppStepApp, app);
				}
			};

			const watchMode = (app) => {
				const isAppSame = this.isAppSame(app);

				if (!this.watchSelfApp) {
					if (!this.isSelfApp(app)) {
						return this.strictMode(isAppSame, app);
					}
				} else {
					return this.strictMode(isAppSame, app);
				}
			};

			if (!app || GmDC.isEmptyObj(app)) {
				return;
			}


			switch (this.mode) {
				case "normal":
					return normalMode(app);
				case "strict":
					return strictMode(app);
				case "watch":
					return watchMode(app);
				default:
					log.info("INVALID MODE");
					this.stop();
			}
		} catch (err) {
			log.error(err);
			throw err;
		} finally {
			this.emit("CHECK-AGAIN");
		}
	}

	getProcessName(app) {
		if (app && app.owner) {
			let { owner } = app;
			let name = owner.name.toLowerCase();
			if(name.includes(".exe")){
				return name.replace(".exe", "").toLowerCase();
			}else{
				let appName = GmDC.getAppNameFromAppInfo(app).toLowerCase();
				return appName.replace(".exe", "").toLowerCase();
			}
		}

		return null;
	}

	getWinTitle(app) {
		if (app && app.title) {
			return app.title;
		}

		return null;
	}

	getProcessId(app) {
		if (app && app.owner) {
			let { owner } = app;
			return owner.pid;
		}

		return null;
	}

	isStepAppInFocus(foregroundWinInfo) {
		if (!GmDC.isPlainObject(this.step_app)) {
			return true;
		}

		let CURRENT_WIN_PROCESS_NAME = this.getProcessName(foregroundWinInfo);
		let APP_PROCESS_NAME = this.getProcessName(this.step_app);
		const PREV_APP_PROCESS_NAME = this.getProcessName(this.stepAppToMonitorInfo);

		//Remove '.exe' from both the strings, sometimes the values make problem
		CURRENT_WIN_PROCESS_NAME = CURRENT_WIN_PROCESS_NAME.toLowerCase().includes('.exe')? CURRENT_WIN_PROCESS_NAME: `${CURRENT_WIN_PROCESS_NAME}.exe` ;
		APP_PROCESS_NAME = APP_PROCESS_NAME.toLowerCase().includes('.exe')? APP_PROCESS_NAME: `${APP_PROCESS_NAME}.exe` ;

		const IS_APP_FOCUSED = CURRENT_WIN_PROCESS_NAME.toLowerCase() === APP_PROCESS_NAME.toLowerCase();

		IS_APP_FOCUSED && this.setAppProcessInfo(foregroundWinInfo);

		return IS_APP_FOCUSED;
	}

	getAppProcessInfo() {
		return this.stepAppProcessInfo;
	}

	setAppProcessInfo(app) {
		this.stepAppProcessInfo = app.owner;
	}

	startScrollListener() {
		let self = this;
		if (!this.scrollMonitor) {
			this.scrollMonitor = new ScrollMonitor();
			this.scrollMonitor.on(EVENT_TYPES.SCROLL_EVENT, () => {
				if (self.activateScrollListener) {
					activeApp()
						.then((app) => self.emitEvent(EVENT_TYPES.SCROLL_EVENT, app))
						.catch((err) => console.error(err));
				}
			});
		}
	}

	stopScrollListener() {
		this.activateScrollListener = false;
		this.scrollMonitor && this.scrollMonitor.stop();
	}

	startClickMontitor() {
		let self = this;
		if (!this.clickMonitor) {
			this.clickMonitor = new generalEvents.clickEvents({
				completionEventCB: () => {
					//TODO need seperate active flag for click events;
					if (true) self.emitEvent(EVENT_TYPES.CLICK_EVENT);
				},
				mousePressed: false,
			});
			this.clickMonitor.start();
		}
	}

	stopClickMontior() {
		this.clickMonitor && this.clickMonitor.stop();
		this.clickMonitor = null;
	}

	start() {
		this.tick();

		this.monitorScrollEvents && this.startScrollListener();

		this.once("CHECK-AGAIN", () => {
			if (this.targetState === "start") {
				this.timeout = setTimeout(() => {
					this.start();
				}, this.interval);
			}
		});
	}

	stop() {
		log.warn("APP Monitor Stopped");
		
		log.warn("Stopping App Montior");
		
		this.targetState = "stop";

		if (this.timeout) clearTimeout(this.timeout);

		if (this.scrollMonitor) {
			this.stopScrollListener();
		}
		if (this.clickMonitor) {
			this.stopClickMontior();
		}

		this.scrollMonitor = null;
		this.clickMonitor = null;
	}
}

let _export = {
	ActiveAppMonitor,
	MonitorEvents: EVENT_TYPES,
};
export default _export;
