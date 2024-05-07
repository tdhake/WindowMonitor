var edge = require('edge-js');

var getActiveWindowTitle = edge.func({
    source: function() {/* 
        using System;
        using System.Text;
        using System.Runtime.InteropServices;

        public class Startup
        {
            [DllImport("user32.dll")]
            static extern IntPtr GetForegroundWindow();

            [DllImport("user32.dll")]
            static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int count);

            public async Task<object> Invoke(object input)
            {
                const int nChars = 256;
                StringBuilder Buff = new StringBuilder(nChars);
                IntPtr handle = GetForegroundWindow();

                if (GetWindowText(handle, Buff, nChars) > 0)
                {
                    return Buff.ToString();
                }

                return null;
            }
        }
    */},
    references: [ 'System.dll', 'System.Threading.Task.dll' ]
});

getActiveWindowTitle(null, function(error, result) {
    if (error) throw error;
    console.log(result);
});
