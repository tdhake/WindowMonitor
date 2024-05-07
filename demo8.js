/*
    Checking RegisterShellHookWindow and HSHELL_WINDOWDESTROYED with new window.
*/
const ffi = require('ffi-napi');
const ref = require('ref-napi');
const Struct = require('ref-struct-di')(ref);
const int = ref.types.int;
const bool = ref.types.bool;
const voidPtr = ref.refType(ref.types.void);
const uintPtr = ref.refType(ref.types.uint32);

const MSG = Struct({
  'hwnd': voidPtr,
  'message': uintPtr,
  'wParam': voidPtr,
  'lParam': voidPtr,
  'time': uintPtr,
  'pt': Struct({
    'x': int,
    'y': int
  })
});

const user32 = ffi.Library('user32.dll', {
  'RegisterShellHookWindow': [bool, [voidPtr]],
  'GetMessageW': [int, [MSG, voidPtr, int, int]],
  'TranslateMessage': [bool, [MSG]],
  'DispatchMessageW': [uintPtr, [MSG]],
  'CreateWindowExW': [voidPtr, [uintPtr, 'string', 'string', uintPtr, int, int, int, int, voidPtr, voidPtr, voidPtr, voidPtr]]
});

const WH_SHELL = 10;
const HSHELL_WINDOWDESTROYED = 2;

const bufferLength = 10;
const buf = Buffer.alloc(bufferLength);
const bufPtr = ref.refType(ref.types.void);
const instance = ref.alloc(bufPtr, buf);

// Create a hidden window
const hWnd = user32.CreateWindowExW(0, 'Message', instance, 0, 0, 0, 0, 0, null, null, null, null);

// Register the window for Shell hook messages
if (!user32.RegisterShellHookWindow(hWnd)) {
  throw new Error('Failed to register window for Shell hook messages');
}

const msg = new MSG();
while (user32.GetMessageW(msg.ref(), null, 0, 0) !== 0) {
  if (msg.message === WH_SHELL && msg.wParam === HSHELL_WINDOWDESTROYED) {
    console.log('A window was terminated');
  }
  user32.TranslateMessage(msg.ref());
  user32.DispatchMessageW(msg.ref());
}
