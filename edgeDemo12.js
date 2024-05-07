const edge = require('edge-js');
const path = require('path');

// const winEventHook = edge.func(`./MonitorForegroundApp.cs`);

// Start the WinEventHook
// winEventHook('StartHook', (error, result) => {
//     if (error) {
//         console.error('Error starting WinEventHook:', error);
//     } else {
//         console.log('WinEventHook started successfully!');
//     }
// });

// Stop the WinEventHook when done
// process.on('exit', () => {
//     winEventHook('StopHook', (error, result) => {
//         if (error) {
//             console.error('Error stopping WinEventHook:', error);
//         } else {
//             console.log('WinEventHook stopped successfully!');
//         }
//     });
// });



// const monitorAppTermination = edge.func({
//     source: path.join(__dirname, './Startup.cs'),
//     references: ['System.Windows.Forms.dll']
// });

// monitorAppTermination({ handle: process.handle }, (error, result) => {
//     if (error) console.error(error);
// });



// const monitorAppTermination = edge.func({
//     source: path.join(__dirname, './Startup.cs'),
//     references: ['System.Windows.Forms.dll']
// });

// monitorAppTermination({ handle: process.handle }, (error, result) => {
//     if (error) console.error(error);
// });