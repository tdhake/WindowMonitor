/*
    Checking RegisterShellHookWindow and HSHELL_WINDOWDESTROYED with existing window.
*/
const ffi = require('ffi-napi');
const ref = require('ref-napi');
const StructType = require('ref-struct-di')(ref);

// Define the necessary Windows types
const HWND = ref.types.uint32;

// Define the RegisterShellHookWindow function
const user32 = ffi.Library('user32', {
  RegisterShellHookWindow: ['bool', [HWND]],
  GetForegroundWindow: ['pointer', []]
});

// Define the HSHELL_WINDOWDESTROYED constant
const HSHELL_WINDOWDESTROYED = 2;

// Get the handle of the foreground window
const hWnd = user32.GetForegroundWindow();

try {// Call RegisterShellHookWindow with the HWND
    const result = user32.RegisterShellHookWindow(hWnd);
    console.log("RegisterShellHookWindow", result);
    console.log(hWnd);
    if (!result) {
        console.error('Failed to register shell hook window');
        process.exit(1);
    }
   
} catch(error) {
    console.error(error)
}

// Define types
const int64 = ref.types.int64;
const uint = ref.types.uint;
const long = ref.types.long;
const pointer = ref.refType(ref.types.void);

// Define POINT structure
const POINT = StructType({
  x: ref.types.long,
  y: ref.types.long
});

// Define MSG structure
const MSG = StructType({
  hwnd: ref.types.uintptr,
  message: ref.types.uint32,
  wParam: ref.types.uintptr_t,
  lParam: ref.types.long,
  time: ref.types.uint32,
  pt: POINT
});

// Create an instance of MSG
const msg1 = new MSG();

// Set up a message loop to receive and handle the shell notifications
const msgLoop = () => {
  const msg = ref.alloc(msg1);
  while (user32.GetMessageW(msg.ref(), null, 0, 0)) {
    console.log('msg',msg);
    if (msg && msg.type === HSHELL_WINDOWDESTROYED) {
      console.log('A window was destroyed');
    }
    user32.TranslateMessage(msg);
    user32.DispatchMessageW(msg);
  }
};

msgLoop();
