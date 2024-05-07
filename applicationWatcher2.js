const ffi = require('ffi-napi');
const ref = require('ref-napi');
const wchar = require('ref-wchar-napi');
// const { WorkerData, parentPort } = require('worker_threads');

//Initialize
const msgType = ref.types.void;
const msgPtr = ref.refType(msgType);
const EVENT_SYSTEM_FOREGROUND = 3;
const WINEVENT_OUTOFCONTEXT = 0;
const WINEVENT_SKPIOWNPROCESS = 2;
const EVENT_SYSTEM_MOVESIZEEND = 11;
const EVENT_SYSTEM_MOVESIZESTART = 10;
const EVENT_SYSTEM_CAPTURESTART = 8;
const MAX_PATH = 512;

let prevWinBounds, activeWindowDimensions;
let prevPID = 0;
let appSwitched = false;

const handleType = ref.types.void;
var handlePtr = ref.refType(msgType);
handlePtr.types = ref.types.void;
var lpdwordPtr = ref.refType(ref.types.ulong);

//Declare DLL return and arguments
const user32 = ffi.Library('user32', {
	SetWinEventHook: [
		'int',
		['int', 'int', 'pointer', 'pointer', 'int', 'int', 'int'],
	],
	GetWindowTextW: ['int', ['pointer', 'pointer', 'int']],
	GetWindowTextLengthW: ['int', ['pointer']],
	GetMessageA: ['bool', [msgPtr, 'int', 'uint', 'uint']],
	GetWindowRect: ['bool', ['long', 'pointer']],
	GetWindowThreadProcessId: ['long', ['pointer', 'pointer']],
	// GetForegroundWindow: ['long', []],
});

const oleacc = ffi.Library('Oleacc', {
	GetProcessHandleFromHwnd: ['pointer', ['pointer']],
});

const psapi = ffi.Library('psapi', {
	GetProcessImageFileNameW: ['int', ['pointer', 'pointer', 'int']],
});

function getMessage() {
	console.log('Message - ', msgPtr);
	return user32.GetMessageA(ref.alloc(msgPtr), null, 0, 0);
}

function isChangeInRange(val1, val2, range) {
	if (Math.abs(parseInt(val1) - parseInt(val2)) > range) {
		return true;
	}
	return false;
}

function isPosChanged(currentWininfo) {
	if (!prevWinBounds) {
		prevWinBounds = {
			left: 0,
			top: 0,
			right: 0,
			bottom: 0,
		};
	}
	const {
		left: prev_left,
		top: prev_top,
		right: prev_right,
		bottom: prev_bottom,
	} = prevWinBounds;
	const {
		left: new_left,
		top: new_top,
		right: new_right,
		bottom: new_bottom,
	} = currentWininfo;
	const IGNORE_CHANGE_IN_POS_BY = 0;

	const isLeftChanged = isChangeInRange(
		new_left,
		prev_left,
		IGNORE_CHANGE_IN_POS_BY,
	);
	const isRightChanged = isChangeInRange(
		new_right,
		prev_right,
		IGNORE_CHANGE_IN_POS_BY,
	);
	const isTopChanged = isChangeInRange(
		new_top,
		prev_top,
		IGNORE_CHANGE_IN_POS_BY,
	);
	const isBottomChanged = isChangeInRange(
		new_bottom,
		prev_bottom,
		IGNORE_CHANGE_IN_POS_BY,
	);

	if (isLeftChanged || isRightChanged || isTopChanged || isBottomChanged) {
		prevWinBounds = currentWininfo;
		return true;
	}

	return false;
}

//Callback handler
const pfnWinEventProc = ffi.Callback(
	'void',
	['pointer', 'int', 'pointer', 'long', 'long', 'int', 'int'],
	function (
		hWinEventHook,
		event,
		hwnd,
		idObject,
		idChild,
		idEventThread,
		dwmsEventTime,
	) {
		const windowTitleLength = user32.GetWindowTextLengthW(hwnd);
		const bufferSize = windowTitleLength * 2 + 4;
		const titleBuffer = Buffer.alloc(bufferSize);
		user32.GetWindowTextW(hwnd, titleBuffer, bufferSize);
		const titleText = ref.reinterpretUntilZeros(titleBuffer, wchar.size);
		const finallyWindowTitle = wchar.toString(titleText);
		let retData = {};
		try {
			var processNameBuffer = Buffer.alloc(MAX_PATH * 2 + 2);
			handlePtr = oleacc.GetProcessHandleFromHwnd(hwnd);
			psapi.GetProcessImageFileNameW(
				handlePtr,
				processNameBuffer,
				MAX_PATH * 2,
			);
			const processNameText = ref.reinterpretUntilZeros(
				processNameBuffer,
				wchar.size,
			);
			const finalProcessNameText = wchar.toString(processNameText);
			var pid = ref.alloc(lpdwordPtr);
			const v = user32.GetWindowThreadProcessId(hwnd, pid);
			retData = {
				event: event,
				app: finalProcessNameText,
				title: finallyWindowTitle,
				pid: pid.readInt32LE(0),
			};

			// When a window is minimized or not in focus, Windows might change the window title to ‘Running applications’.
			if (
				// EVENT_SYSTEM_MOVESIZEEND == event ||
				EVENT_SYSTEM_CAPTURESTART == event &&
				finallyWindowTitle != 'Running applications'
			) {
				if (prevPID != retData.pid) {
					prevPID = retData.pid;
					appSwitched = true;
				} else appSwitched = false;
				// create rectangle from pointer
				const pointerToRect = function (rectPointer) {
					return {
						left: rectPointer.readInt16LE(0),
						top: rectPointer.readInt16LE(4),
						right: rectPointer.readInt16LE(8),
						bottom: rectPointer.readInt16LE(12),
					};
				};

				// obtain window dimension
				const getWindowDimensions = function (handle) {
					const rectPointer = Buffer.alloc(16);
					const getWindowRect = user32.GetWindowRect(handle, rectPointer);
					return !getWindowRect ? null : pointerToRect(rectPointer);
				};

				activeWindowDimensions = getWindowDimensions(ref.address(hwnd));

				// Check if the function succeeded
				if (activeWindowDimensions) {
					// get active window width and height
					const activeWindowWidth =
						activeWindowDimensions.right - activeWindowDimensions.left;
					const activeWindowHeight =
						activeWindowDimensions.bottom - activeWindowDimensions.top;
					retData = {
						...retData,
						dimension: { ...activeWindowDimensions },
						height: activeWindowHeight,
						width: activeWindowWidth,
					};
				} else {
					console.error('GetWindowRect failed');
				}
			}
			// Check if the position/size is changed in case of capture event
			if (
				finallyWindowTitle != 'Running applications' && // EVENT_SYSTEM_MOVESIZEEND == event ||
				!appSwitched &&
				EVENT_SYSTEM_CAPTURESTART == event &&
				isPosChanged(activeWindowDimensions)
			) {
				console.debug(finallyWindowTitle, 'Event', event, 'Window size/position is changed');
				// parentPort.postMessage(JSON.stringify(retData));
			} else if (EVENT_SYSTEM_FOREGROUND == event) {
				console.debug(finallyWindowTitle, 'Event', event, 'Foreground app is changed');
				// parentPort.postMessage(JSON.stringify(retData));
			}
		} catch (e) {
			console.error(e);
		}
	},
);

// user32.SetWinEventHook(
// 	EVENT_SYSTEM_MOVESIZEEND,
// 	EVENT_SYSTEM_MOVESIZEEND,
// 	null,
// 	pfnWinEventProc,
// 	0,
// 	0,
// 	WINEVENT_OUTOFCONTEXT | WINEVENT_SKPIOWNPROCESS,
// );

//Register for callback notification
user32.SetWinEventHook(
	EVENT_SYSTEM_FOREGROUND,
	EVENT_SYSTEM_FOREGROUND,
	null,
	pfnWinEventProc,
	0,
	0,
	WINEVENT_OUTOFCONTEXT | WINEVENT_SKPIOWNPROCESS,
);

user32.SetWinEventHook(
	EVENT_SYSTEM_CAPTURESTART,
	EVENT_SYSTEM_CAPTURESTART,
	null,
	pfnWinEventProc,
	0,
	0,
	WINEVENT_OUTOFCONTEXT | WINEVENT_SKPIOWNPROCESS,
);

let ret = getMessage();
