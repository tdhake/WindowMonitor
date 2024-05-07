const ffi = require('ffi-napi');
const ref = require('ref-napi');

const user32 = new ffi.Library('user32.dll', {
  'SetWinEventHook': ['pointer', ['uint', 'uint', 'pointer', 'pointer', 'uint', 'uint', 'uint']],
  'UnhookWinEvent': ['bool', ['pointer']],
});

const EVENT_SYSTEM_FOREGROUND = 3;
const EVENT_OBJECT_DESTROY = 32769;
const WINEVENT_OUTOFCONTEXT = 0; // Events are ASYNC

// Define the callback function type.
const WinEventProc = ffi.Callback('void', ['pointer', 'uint', 'long', 'long', 'long', 'uint', 'uint'],
  function(hWinEventHook, event, hwnd, idObject, idChild, dwEventThread, dwmsEventTime) {
    console.log('Window event occurred:', event);
    if (event === EVENT_OBJECT_DESTROY) {
      console.log('A window was closed');
    }
  }
);

// Set the event hook.
const hook = user32.SetWinEventHook(EVENT_SYSTEM_FOREGROUND, EVENT_OBJECT_DESTROY, null, WinEventProc, 0, 0, WINEVENT_OUTOFCONTEXT);

// Ensure the hook is unhooked when your process exits.
process.on('exit', function() {
  user32.UnhookWinEvent(hook);
});
