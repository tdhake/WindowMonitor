using System;
using System.Runtime.InteropServices;
using System.Windows.Forms;
using System.Threading.Tasks;
// using System.Diagnostics;

public class Startup
{
    public const int HSHELL_WINDOWDESTROYED = 2;
    public delegate void WndProcDelegate(IntPtr hWnd, uint msg, IntPtr wParam, IntPtr lParam);

    [DllImport("user32.dll")]
    public static extern bool RegisterShellHookWindow(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern int RegisterWindowMessage(string message);

    public async Task<object> Invoke(dynamic input)
    {
        var handle = (IntPtr)input.handle;
        RegisterShellHookWindow(handle);
        var shellHookMessage = RegisterWindowMessage("SHELLHOOK");
        var wndProcDelegate = new WndProcDelegate((hWnd, msg, wParam, lParam) =>
        {
            if (msg == shellHookMessage && wParam.ToInt32() == HSHELL_WINDOWDESTROYED)
            {
                Console.WriteLine("Foreground application terminated.");
            }
        });
        Application.Run();
        return null;
    }
    
}
