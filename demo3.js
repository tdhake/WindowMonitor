const ffi = require('ffi-napi');
const ref = require('ref-napi');

// Define necessary types
const WINEVENTPROC = ffi.Function('void', ['long', 'long', 'long', 'long', 'long', 'long', 'long']);
const HWINEVENTHOOK = ref.types.uint32;
const DWORD = ref.types.uint32;


// Define necessary constants
const EVENT_OBJECT_DESTROY = 0x8001;
const WINEVENT_OUTOFCONTEXT = 0x0000;

// Load user32.dll
const user32 = ffi.Library('user32.dll', {
  'SetWinEventHook': [HWINEVENTHOOK, [DWORD, DWORD, 'pointer', WINEVENTPROC, DWORD, DWORD, DWORD]],
  'UnhookWinEvent': ['bool', [HWINEVENTHOOK]]
});

// Define the event procedure
const eventProc = ffi.Callback('void', ['int', 'pointer', 'long', 'long', 'int', 'int'], (event, hwnd, idObject, idChild, dwEventThread, dwmsEventTime) => {
  if (event === EVENT_OBJECT_DESTROY) {
    console.log(`Window ${hwnd} is being destroyed.`);
  }
});

// Set the event hook
const hook = user32.SetWinEventHook(EVENT_OBJECT_DESTROY, EVENT_OBJECT_DESTROY, null, eventProc, 0, 0, WINEVENT_OUTOFCONTEXT);
if (!hook) {
  console.error('Failed to set event hook.');
  process.exit(1);
}

// Clean up when the process exits
process.on('exit', () => {
  user32.UnhookWinEvent(hook);
});
