const ffi = require('ffi-napi');
const ref = require('ref-napi');
const Buffer = require('buffer').Buffer;
const activeApp = require("active-win");

let stepAppToMonitorInfo;

// Define the user32 library functions
// const user32 = new ffi.Library('user32', {
//   'GetForegroundWindow': ['long', []],
//   'GetWindowTextA': ['int', ['long', 'string', 'int']]
// });

// Function to get the handle of the foreground window
// function GetForegroundWindowHandle() {
//   return user32.GetForegroundWindow();
// }

// Function to get the text of the foreground window
// function GetForegroundWindowText() {
//   const buffer = Buffer.alloc(256)
//   let handle = GetForegroundWindowHandle();
//   let length = user32.GetWindowTextA(handle, buffer, 256);
//   return buffer.toString().substr(0, length);
// }

/**
 * Returns self app name in lowercase
 * @return {String} self app name
 */
// let selfName = process.env.NODE_ENV !== "development" ?
//     Constants.ENV_CONSTANTS.applicationName.toLowerCase().replace('.exe', '') :
//     "electron";

const selfName = '@nx-svelte/source';
// const selfName = 'Windows Command Processor';

// let stepAppToMonitorInfo;

function isSelfApp(app) {
    if (app && app.owner) {
        // return app.owner.name.replace(".exe", "").toLowerCase() == selfName;
        return app.owner.name == selfName;
    }
    return false;
}

function updateAppToMonitorInfo(app) {
    stepAppToMonitorInfo = app;
}

// function resetMonitoredApp() {
//     stepAppToMonitorInfo = null;
// }

function isChangeInRange(val1, val2, range) {
    if (Math.abs(parseInt(val1) - parseInt(val2)) > range) {
        return true;
    }
    return false;
}

function isPosChanged(currentWininfo) {
    if (stepAppToMonitorInfo) {
        const prevWinBounds = stepAppToMonitorInfo.bounds;

        const { x: prev_x, y: prev_y, w: prev_w, h: prev_h } = prevWinBounds;
        const { x: new_x, y: new_y, w: new_w, h: new_h } = currentWininfo.bounds;
        const IGNORE_CHANGE_IN_POS_BY = 20;

        const isXChanged = isChangeInRange(new_x, prev_x, IGNORE_CHANGE_IN_POS_BY);
        const isYChanged = isChangeInRange(new_y, prev_y, IGNORE_CHANGE_IN_POS_BY);
        const isWChanged = isChangeInRange(new_w, prev_w, IGNORE_CHANGE_IN_POS_BY);
        const isHChanged = isChangeInRange(new_h, prev_h, IGNORE_CHANGE_IN_POS_BY);

        if (isXChanged || isYChanged || isWChanged || isHChanged) {
          console.log(currentWininfo.bounds);
            return true;
        }

        return false;
    }
}

// Continuously print the title of the foreground window
setInterval(async () => {
  try {
    let app = await activeApp();
    // console.log(GetForegroundWindowText());
    console.log('isselfapp',isSelfApp(app));
    if(!isSelfApp(app)){
      console.log('activeWindow - ', app.owner.name);
      if(isPosChanged(app)){
        console.log('Bound values have changed!!');
      }
    }
    updateAppToMonitorInfo(app);
  } catch (err) {
      throw err;
  } 
}, 1000);

// function strictMode(isStepAppInFocus, app) {
//   let eventToEmit = null;

//   // this.monitorScrollEvents && this.scrollMonitor && this.scrollMonitor.start();
//   // this.monitorClickEvents && this.startClickMontitor();

//   const EMIT_BLUR_EVENT = !isStepAppInFocus;
//   const EMIT_FOCUS_EVENT = isStepAppInFocus && (this.prevEmitEvent === EVENT_TYPES.APP_BLUR || this.prevEmitEvent === null);

//   if (EMIT_BLUR_EVENT) {
//     eventToEmit = EVENT_TYPES.APP_BLUR;
//   } else {
//     if (EMIT_FOCUS_EVENT) {
//       eventToEmit = EVENT_TYPES.APP_FOCUS;
//     } else {
//       const IS_TITLE_CHANGED = this.isTitleChanged(app);
//       const IS_POS_CHANGED = this.isPosChanged(app);
//       const IS_WINDOW_CHANGED = this.isWindowChanged(app);

//       const EMIT_POS_FIX_EVENT = this.prevEmitEvent === EVENT_TYPES.APP_POS_CHANGE && !IS_POS_CHANGED;
//       const EMIT_TITLE_CHANGE_EVENT = this.prevEmitEvent !== EVENT_TYPES.APP_WINDOW_CHANGE && IS_TITLE_CHANGED;

//       if (IS_WINDOW_CHANGED) {
//         eventToEmit = EVENT_TYPES.APP_WINDOW_CHANGE;
//       } else if (EMIT_TITLE_CHANGE_EVENT && this.monitorAppTitle) {
//         eventToEmit = EVENT_TYPES.APP_TITLE_CHANGE;
//       } else if (IS_POS_CHANGED) {
//         eventToEmit = EVENT_TYPES.APP_POS_CHANGE;
//       } else if (EMIT_POS_FIX_EVENT) {
//         eventToEmit = EVENT_TYPES.APP_POS_FIX;
//       }
//     }
//   }

//   eventToEmit && this.emitEvent(eventToEmit, app);
//   this.updateAppToMonitorInfo(app);
// }

// function getProcessName(app) {
//     if (app && app.owner) {
//         let { owner } = app;
//         let name = owner.name.toLowerCase();
//         if(name.includes(".exe")){
//             return name.replace(".exe", "").toLowerCase();
//         }else{
//             let appName = GmDC.getAppNameFromAppInfo(app).toLowerCase();
//             return appName.replace(".exe", "").toLowerCase();
//         }
//     }

//     return null;
// }

// function isStepAppInFocus(foregroundWinInfo) {
//     // if (!GmDC.isPlainObject(this.step_app)) {
//     //     return true;
//     // }

//     let CURRENT_WIN_PROCESS_NAME = getProcessName(foregroundWinInfo);
//     let APP_PROCESS_NAME = getProcessName(this.step_app);
//     const PREV_APP_PROCESS_NAME = getProcessName(this.stepAppToMonitorInfo);

//     //Remove '.exe' from both the strings, sometimes the values make problem
//     CURRENT_WIN_PROCESS_NAME = CURRENT_WIN_PROCESS_NAME.toLowerCase().includes('.exe')? CURRENT_WIN_PROCESS_NAME: `${CURRENT_WIN_PROCESS_NAME}.exe` ;
//     APP_PROCESS_NAME = APP_PROCESS_NAME.toLowerCase().includes('.exe')? APP_PROCESS_NAME: `${APP_PROCESS_NAME}.exe` ;

//     const IS_APP_FOCUSED = CURRENT_WIN_PROCESS_NAME.toLowerCase() === APP_PROCESS_NAME.toLowerCase();

//     IS_APP_FOCUSED && this.setAppProcessInfo(foregroundWinInfo);

//     return IS_APP_FOCUSED;
// }

// async function tick() {
//     try {
//         let app = await activeApp();

//         if(app && app.owner)	{
//             app.owner.name = app.owner.name.toLowerCase();
//             app.owner.path = app.owner.path.toLowerCase();
//         }

        // const normalMode = (app) => {
        //     const isForegroundAppStepApp = this.isStepAppInFocus(app);
        //     if (!this.watchSelfApp) {
        //         if (!this.isSelfApp(app)) {
        //             return this.normalMode(isForegroundAppStepApp, app);
        //         }
        //     } else {
        //         return this.normalMode(isForegroundAppStepApp, app);
        //     }
        // };

        // const strictMode = (app) => {
        //     const isForegroundAppStepApp = this.isStepAppInFocus(app);

        //     if (!this.watchSelfApp) {
        //         if (!this.isSelfApp(app)) {
        //             return strictMode(isForegroundAppStepApp, app);
        //         } else {
        //             return false;
        //         }
        //     } else {
        //         return this.strictMode(isForegroundAppStepApp, app);
        //     }
        // };

        // const watchMode = (app) => {
        //     const isAppSame = this.isAppSame(app);

        //     if (!this.watchSelfApp) {
        //         if (!this.isSelfApp(app)) {
        //             return this.strictMode(isAppSame, app);
        //         }
        //     } else {
        //         return this.strictMode(isAppSame, app);
        //     }
        // };

        // if (!app || GmDC.isEmptyObj(app)) {
        //     return;
        // }


        // switch (this.mode) {
        //     case "normal":
        //         return normalMode(app);
        //     case "strict":
        //         return strictMode(app);
        //     case "watch":
        //         return watchMode(app);
        //     default:
        //         log.info("INVALID MODE");
        //         this.stop();
        // }

    //     strictMode(app);
    // } catch (err) {
    //     log.error(err);
    //     throw err;
    // } 
    // finally {
    //     this.emit("CHECK-AGAIN");
    // }   
// }


