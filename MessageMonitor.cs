using System;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Windows.Forms;

public class MessageMonitor
{
    private const int HSHELL_WINDOWDESTROYED = 0x0002;
    private const int WM_QUIT = 0x0012;

    [DllImport("user32.dll")]
    private static extern bool RegisterShellHookWindow(IntPtr hWnd);

    [DllImport("user32.dll")]
    private static extern bool DeregisterShellHookWindow(IntPtr hWnd);

    [DllImport("user32.dll")]
    private static extern int ShellHookProc(int code, IntPtr wParam, IntPtr lParam);

    public async Task<object> ShowMessageBoxAndWait()
    {
        // Registering the shell hook window
        IntPtr handle = Process.GetCurrentProcess().MainWindowHandle;
        RegisterShellHookWindow(handle);

        // Creating and showing a message box
        MessageBox.Show("Hello, world!");

        // Unregistering the shell hook window
        DeregisterShellHookWindow(handle);

        return null;
    }

    public async Task<object> MonitorWindow()
    {
        // Continuously monitor for shell hook events
        while (true)
        {
            int result = ShellHookProc(0, IntPtr.Zero, IntPtr.Zero);
            if (result == HSHELL_WINDOWDESTROYED || result == WM_QUIT)
            {
                Console.WriteLine("Message box closed.");
                break;
            }
            await Task.Delay(100); // Adjust delay as needed
        }

        return null;
    }
}
