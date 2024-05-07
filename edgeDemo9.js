const edge = require('edge-js');

// Load the compiled C# DLL
const monitor = edge.func({
    assemblyFile: './appMonitorCLR2.dll',
    typeName: 'appMonitorCLR.ForegroundAppMonitor',
    methodName: 'StartMonitoring',
    architecture: 'x64'
});

// Start monitoring foreground app changes and termination
monitor(null, (error, result) => {
    if (error) throw error;
    console.log('Foreground app monitoring started.');
});
