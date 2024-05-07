const ffi = require('ffi-napi');
const ref = require('ref-napi');
const kernel32 = new ffi.Library('kernel32', {
  'GetExitCodeProcess': ['bool', ['pointer', 'pointer']]
});
const user32 = ffi.Library('user32', {
    GetWindowThreadProcessId: ['long', ['pointer', 'pointer']],
    GetForegroundWindow: ['long', []],
})

const activeWindowHandle = user32.GetForegroundWindow();
const handleBuffer = ref.alloc('long', activeWindowHandle);
var lpdwordPtr = ref.refType(ref.types.ulong);
let pid = ref.alloc(lpdwordPtr);
const v = user32.GetWindowThreadProcessId(handleBuffer, pid);
// let pid = 1234; // replace with your process id
console.log('pid', pid, 'v', v, 'handle', handleBuffer);
let PROCESS_ALL_ACCESS = 0x1F0FFF;
let hProcess = kernel32.OpenProcess(PROCESS_ALL_ACCESS, false, v);
if (ref.isNull(hProcess)) {
  throw new Error('Failed to open process.');
}

let exitCode = ref.alloc('uint32');
let result = kernel32.GetExitCodeProcess(hProcess, exitCode);

if (!result) {
  throw new Error('Failed to get exit code.');
}

console.log('Exit code:', exitCode.deref());
