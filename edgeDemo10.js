const edge = require('edge-js');
const path = require('path');

// Load the C# code from the file
const winEventHook = edge.func({
    source: path.join(__dirname, './Program.cs'),
    references: ['System.Windows.Forms.dll']
});

winEventHook(null, function (error, result) {
    if (error) throw error;
});
