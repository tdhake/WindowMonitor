const ffi = require('ffi-napi');
const ref = require('ref-napi');
const Struct = require('ref-struct-napi');

// Define necessary types
const HWND = ref.types.uint32;
const UINT = ref.types.uint32;
const WPARAM = ref.types.uint32;
const LPARAM = ref.types.uint32;
const HOOKPROC = ffi.Function('int', [WPARAM, LPARAM]);

// Define necessary structs
const CWPRETSTRUCT = Struct({
  lResult: ref.types.long,
  lParam: LPARAM,
  wParam: WPARAM,
  message: UINT,
  hwnd: HWND
});

// Define necessary constants
const WH_CALLWNDPROCRET = 12;
const WM_DESTROY = 0x0002;

// Load user32.dll
const user32 = ffi.Library('user32.dll', {
  'SetWindowsHookExW': ['int', ['int', HOOKPROC, 'int', 'int']],
  'UnhookWindowsHookEx': ['bool', ['int']],
  'CallNextHookEx': ['int', ['int', 'int', WPARAM, ref.refType(CWPRETSTRUCT)]]
});

// Define the hook procedure
const hookProc = ffi.Callback('int', [WPARAM, ref.refType(CWPRETSTRUCT)], (nCode, cwpr) => {
  if (nCode >= 0) {
    const data = cwpr.deref();
    if (data.message === WM_DESTROY) {
      console.log(`Window ${data.hwnd} is being destroyed.`);
    }
  }
  return user32.CallNextHookEx(null, nCode, cwpr.wParam, cwpr);
});

// Set the hook
const hook = user32.SetWindowsHookExW(WH_CALLWNDPROCRET, hookProc, null, 0);
if (!hook) {
  console.error('Failed to set hook.');
  process.exit(1);
}

// Clean up when the process exits
process.on('exit', () => {
  user32.UnhookWindowsHookEx(hook);
});
