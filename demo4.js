const ffi = require('ffi-napi');
const user32 = ffi.Library('user32', {
  'SetWindowsHookExA': ['int', ['int', 'pointer', 'int', 'int']],
  'CallNextHookEx': ['int', ['int', 'int', 'int', 'pointer']],
  'UnhookWindowsHookEx': ['bool', ['int']],
});

// Set up the hook:
const hookId = user32.SetWindowsHookExA(3,0,null,0);

// This function will be called whenever a window message is sent:
const callback = ffi.Callback('bool', ['int', 'int', 'pointer'], (code, wParam, lParam) => {
    console.log("wParam",wParam);
  if (wParam === 0011 /* WM_CLOSE or WM_DESTROY */) {
    console.log('Window close or destroy message received');
  }

  // Call the next hook in the chain:
  return user32.CallNextHookEx(hookId, code, wParam, lParam);
});

// When you're done with the hook:
user32.UnhookWindowsHookEx(hookId);
