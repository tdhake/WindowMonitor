
using System;
using System.Text;
using System.Runtime.InteropServices;
using System.Threading.Tasks;

namespace appMonitor
{
    public class Class1
    {
        [DllImport("user32.dll")]
        public static extern int MessageBox(IntPtr hWnd, string text, string caption, uint type);
        static async Task Main(string[] args)
        {
            async Task<object> Invoke()
            {
                MessageBox(IntPtr.Zero, "Hello from C#!", "MessageBox", 0);
                return "Message box displayed.";
            }
            object result = await Invoke();
            /* string formattedString = result.ToString();
            Console.WriteLine(formattedString); */
        }
    }
}