const ffi = require('ffi-napi');
const ref = require('ref-napi');

// Define the path to the C# DLL
const dllPath = './WindowMonitor.dll';

// Define the function signatures
const shellHookCallback = ffi.Callback('pointer', ['int', 'pointer', 'pointer'], (nCode, wParam, lParam) => {
    if (nCode >= 0 && wParam.readInt32LE(0) === 4 /* HSHELL_WINDOWACTIVATED */) {
        const user32 = ffi.Library('user32', {
            'GetWindowTextA': ['int', ['pointer', 'pointer', 'int']],
            'GetForegroundWindow': ['pointer', []],
        });
        const buffer = Buffer.alloc(255);
        const handle = user32.GetForegroundWindow();
        user32.GetWindowTextA(handle, buffer, 255);
        const windowTitle = buffer.toString('utf8');
        console.log('Foreground window activated:', windowTitle);
    }
    return ref.NULL;
});

const SetWindowsHookEx = ffi.Library('./WindowMonitor.dll', {
    'SetWindowsHookEx': ['pointer', ['int', 'pointer', 'pointer', 'uint']],
    'RegisterShellHookWindow': ['bool', ['pointer']],
    'StartMonitoring': ['void', []],
    'StopMonitoring': ['void', []],
});

// Start monitoring foreground window activation events
SetWindowsHookEx.StartMonitoring();

// Do something here...

// Stop monitoring when done
SetWindowsHookEx.StopMonitoring();
