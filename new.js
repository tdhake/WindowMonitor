const ffi = require("ffi-napi");
const ref = require('ref-napi');
const struct = require('ref-struct-di')(ref);
const int = ref.types.int;
const long = ref.types.long;

// create foreign function
const user32 = new ffi.Library("user32", {
    //GetWindowPlacement: ["void", ["pointer", "pointer"]]
    "GetWindowRect": ["bool", ['long', 'pointer']],
    "GetForegroundWindow": ["long", []],
    "ShowWindow": ["bool", ["long", "int"]],
    "SetWindowPos": ["bool", ["long", "long", "int", "int", "int", "int", "uint"]],
    'GetWindowTextA': ['int', ['long', 'string', 'int']],
    'GetWindowTextLengthW': ["int", ["pointer"]],
    'GetWindowTextW': ["int", ["pointer", "pointer", "int"]],
})

// create rectangle from pointer
const pointerToRect = function (rectPointer) {
    return {
        left: rectPointer.readInt16LE(0),
        top: rectPointer.readInt16LE(4),
        right: rectPointer.readInt16LE(8),
        bottom: rectPointer.readInt16LE(12)
    };
}
  
// obtain window dimension
const getWindowDimensions = function (handle) {
    const rectPointer = Buffer.alloc(16);
    const getWindowRect = user32.GetWindowRect(handle, rectPointer);
    return !getWindowRect ? null : pointerToRect(rectPointer);
}

// get active window
const activeWindow = user32.GetForegroundWindow();



// Function to get the text of the foreground window
function GetForegroundWindowText(handle) {
  const buffer = Buffer.alloc(256)
//   let handle = GetForegroundWindowHandle();
  let length = user32.GetWindowTextA(handle, buffer, 256);
  return buffer.toString().substr(0, length);

   // Getting window title
//    const windowTitleLength = user32.GetWindowTextLengthW(hwnd)
//    const bufferSize = windowTitleLength * 2 + 4
//    const titleBuffer = Buffer.alloc(bufferSize)
//    user32.GetWindowTextW(hwnd, titleBuffer, bufferSize)
//    const titleText = ref.reinterpretUntilZeros(titleBuffer, wchar.size)
//    return wchar.toString(titleText)
}

// Define the structure needed for GetWindowRect
const Rect = struct({
	left: long,
	top: long,
	right: long,
	bottom: long,
});

// const selfName = '@nx-svelte/source';
const selfName = 'Windows Command Processor';
let stepAppToMonitorInfo;

function isSelfApp(appTitle) {
    if (appTitle) {
        // return app.owner.name.replace(".exe", "").toLowerCase() == selfName;
        return appTitle == selfName;
    }
    return false;
}

function isChangeInRange(val1, val2, range) {
    if (Math.abs(parseInt(val1) - parseInt(val2)) > range) {
        return true;
    }
    return false;
}

function isPosChanged(currentWininfo) {
    if (stepAppToMonitorInfo) {
        const prevWinBounds = stepAppToMonitorInfo;

        const { x: prev_x, y: prev_y, w: prev_w, h: prev_h } = prevWinBounds;
        const { x: new_x, y: new_y, w: new_w, h: new_h } = currentWininfo;
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

setInterval(() => {
	const handle = user32.GetForegroundWindow();
	const rect = new Rect();
	// const success = user32.GetWindowRect(handle, rect.ref());
    // get window dimension
    const activeWindowDimensions = getWindowDimensions(handle);

    const activeWinTitle = GetForegroundWindowText(handle);
	
    if(!isSelfApp(activeWinTitle)){
        console.log(`Active window handle: ${handle}`);
        console.log(`Dimensions: ${JSON.stringify(rect)}`);

        // get active window width and height
        const activeWindowWidth = activeWindowDimensions.right - activeWindowDimensions.left;
        const activeWindowHeight = activeWindowDimensions.bottom - activeWindowDimensions.top;
        console.log('activeWindow - ', activeWinTitle);
        if(isPosChanged(activeWindowDimensions)){
          console.log('Bound values have changed!!');
          console.log('Width: ', activeWindowWidth, 'Height: ', activeWindowHeight);
          stepAppToMonitorInfo = activeWindowDimensions;
        }
      }
}, 1000);