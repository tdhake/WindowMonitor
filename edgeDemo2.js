var edge = require('edge-js');

var getActiveWindowTitle = edge.func(`
    using System;
    using System.Text;
    using System.Runtime.InteropServices;
    using System.Threading.Tasks;

    class Program
    {
        [DllImport("user32.dll")]
        static extern IntPtr GetForegroundWindow();

        [DllImport("user32.dll")]
        static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int count);

        public async Task<object> Invoke(dynamic input)
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

`);

getActiveWindowTitle(null, function (error, result) {
    if (error) throw error;
    console.log(result);
});
