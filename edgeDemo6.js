const edge = require('edge-js');

const showMessageBox = edge.func(`
    using System;
    using System.Runtime.InteropServices;
    using System.Threading.Tasks;

    public class Startup
    {
        [DllImport("user32.dll")]
        public static extern int MessageBox(IntPtr hWnd, string text, string caption, uint type);

        public async Task<object> Invoke(dynamic input)
        {
            MessageBox(IntPtr.Zero, "Hello from C#!", "MessageBox", 0);
            return "Message box displayed.";
        }
    }
`);

showMessageBox(null, (error, result) => {
    if (error) {
        console.error('Error:', error);
    } else {
        console.log('C# Result:', result);
    }
});
