/*
    Checking RegisterShellHookWindow and HSHELL_WINDOWDESTROYED with existing window.
*/
const ffi = require('ffi-napi');
const ref = require('ref-napi');
// const Struct = require('ref-struct-di')(ref);

// Define the necessary Windows types
// const HWND = ref.refType(ref.types.void); //TypeError: could not determine a proper "type" from: undefined
// const HWND = ref.types.uintptr; //TypeError: could not determine a proper "type" from: undefined
const HWND = ref.types.void;
const UINT = ref.types.uint;
const WPARAM = ref.types.uintptr;
const LPARAM = ref.types.long;

// Define the necessary Windows constants
const HSHELL_WINDOWDESTROYED = 2;

// Define the necessary Windows API functions
const user32 = ffi.Library('user32', {
  RegisterShellHookWindow: ['bool', [HWND]],
  GetForegroundWindow: [HWND, []]
});

// Get the handle of the foreground window
const hwnd = user32.GetForegroundWindow();

// Register the shell hook
try{
    const result = user32.RegisterShellHookWindow(hwnd);
    if (!result) {
        console.error('Failed to register shell hook');
        // process.exit(1);
    }
} catch(error) {
    console.error('Error: ', error)
}

// A window procedure is a function that receives and processes all messages sent to the window. 
// It has four parameters and returns a signed value. 
// The parameters consist of a window handle, a UINT message identifier, and two message parameters declared with the WPARAM and LPARAM data types.

// Attach to the shell hook event
const WndProc = ffi.Callback('long', [HWND, UINT, WPARAM, LPARAM], (hwnd, msg, wParam, lParam) => {
  if (result && wParam === HSHELL_WINDOWDESTROYED) {
    console.log('Foreground window was terminated');
  }
  // DefWindowProcW is a function in the Windows API that calls the default window procedure to provide default processing for any window messages that an application does not process. 
  // This function ensures that every message is processed. 
  // DefWindowProcW is called with the same parameters received by the window procedure.
  return user32.DefWindowProcW(hwnd, msg, wParam, lParam);
});

// SetWindowLongPtrW changes an attribute of the specified window. 
// When you use SetWindowLongPtrA with the GWLP_WNDPROC index, it sets a new address for the window procedure.
const oldWndProc = user32.SetWindowLongPtrW(hwnd, -4 /* GWLP_WNDPROC */, WndProc);
if (oldWndProc === 0) {
  console.error('Failed to set window procedure');
  process.exit(1);
}
