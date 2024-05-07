using System;
using System.Diagnostics;
using System.Runtime.InteropServices;
using static System.Net.Mime.MediaTypeNames;

class Program
{
    [DllImport("user32.dll")]
    private static extern bool RegisterShellHookWindow(IntPtr hWnd);

    [DllImport("user32.dll")]
    private static extern bool DeregisterShellHookWindow(IntPtr hWnd);

    [DllImport("user32.dll")]
    private static extern int ShellHookProc(int code, IntPtr wParam, IntPtr lParam);

    private const int HSHELL_WINDOWDESTROYED = 0x0002;
    private const int WM_QUIT = 0x0012;

    static void Main()
    {
        Application.EnableVisualStyles();
        Application.SetCompatibleTextRenderingDefault(false);

        // Registering the shell hook window
        IntPtr handle = Process.GetCurrentProcess().MainWindowHandle;
        RegisterShellHookWindow(handle);

        // Creating and showing a message box
        MessageBox.Show("Hello, world!");

        // Unregistering the shell hook window
        DeregisterShellHookWindow(handle);
    }

    protected override void WndProc(ref Message m)
    {
        base.WndProc(ref m);

        if (m.Msg == WM_QUIT)
        {
            Console.WriteLine("Message box closed.");
        }
    }

    protected override bool ProcessShellKey(Message m)
    {
        if (m.Msg == HSHELL_WINDOWDESTROYED)
        {
            Console.WriteLine("Message box closed.");
        }

        return base.ProcessShellKey(m);
    }
}
