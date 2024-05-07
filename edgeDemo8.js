const edge = require('edge-js');

const monitorForegroundAppTermination = edge.func(`
    #r "System.Windows.Forms.dll"

    using System;
    using System.Diagnostics;
    using System.Runtime.InteropServices;
    using System.Threading.Tasks;

    public class Startup
    {
        private const int WH_SHELL = 10;
        private const int HSHELL_WINDOWDESTROYED = 6;

        private delegate IntPtr HookProc(int code, IntPtr wParam, IntPtr lParam);

        [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
        private static extern IntPtr SetWindowsHookEx(int idHook, HookProc lpfn, IntPtr hMod, uint dwThreadId);

        [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
        private static extern bool UnhookWindowsHookEx(IntPtr hhk);

        [DllImport("kernel32.dll", CharSet = CharSet.Auto, SetLastError = true)]
        private static extern IntPtr GetModuleHandle(string lpModuleName);

        [DllImport("user32.dll")]
        private static extern IntPtr CallNextHookEx(IntPtr hhk, int nCode, IntPtr wParam, IntPtr lParam);

        public async Task<object> Invoke(dynamic input)
        {
            IntPtr hInstance = GetModuleHandle(Process.GetCurrentProcess().MainModule.ModuleName);
            IntPtr hook = SetWindowsHookEx(WH_SHELL, HookCallback, hInstance, 0);

            await Task.Delay(-1); // Keep the application running

            // UnhookWindowsHookEx(hook);
            return null;
        }

        private static IntPtr HookCallback(int code, IntPtr wParam, IntPtr lParam)
        {
            Console.WriteLine("code", code, "wParam", wParam);
            if (code >= 0 && wParam == (IntPtr)HSHELL_WINDOWDESTROYED)
            {
                Console.WriteLine("Foreground application terminated.");
            }

            return CallNextHookEx(IntPtr.Zero, code, wParam, lParam);
        }
    }
`);

monitorForegroundAppTermination(null, (error, result) => {
    if (error) throw error;
    console.log('C# application monitoring foreground app termination started.');
});
