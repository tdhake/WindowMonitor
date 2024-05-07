const ffi = require('ffi-napi');
const ref = require('ref-napi');

const user32 = ffi.Library('user32', {
  'SetWindowsHookExW': ['pointer', ['int', 'pointer', 'pointer', 'uint32']],
  'UnhookWindowsHookEx': ['bool', ['pointer']],
  'CallNextHookEx': ['long', ['pointer', 'int', 'int', 'pointer']],
});

const WH_CALLWNDPROC = 4;
const WM_DESTROY = 0x0002;

const CallWndProc = ffi.Callback('long', ['int', 'int', 'int', 'pointer'],
  (nCode, wParam, lParam) => {
    if (nCode >= 0 && wParam === WM_DESTROY) {
      console.log('Window is being destroyed');
    }
    return user32.CallNextHookEx(null, nCode, wParam, lParam);
  }
);

const hHook = user32.SetWindowsHookExW(WH_CALLWNDPROC, CallWndProc, null, 0);

// ... your code here ...

user32.UnhookWindowsHookEx(hHook);
