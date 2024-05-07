using System;
using System.Diagnostics;
using System.Runtime.InteropServices;

class Program
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

    static IntPtr HookCallback(int code, IntPtr wParam, IntPtr lParam)
    {
        if (code >= 0 && wParam == (IntPtr)HSHELL_WINDOWDESTROYED)
        {
            // Window destroyed, do something here
            Console.WriteLine("Foreground application terminated.");
        }

        return CallNextHookEx(IntPtr.Zero, code, wParam, lParam);
    }

    static void Main()
    {
        IntPtr hInstance = GetModuleHandle(Process.GetCurrentProcess().MainModule.ModuleName);
        IntPtr hook = SetWindowsHookEx(WH_SHELL, HookCallback, hInstance, 0);

        // Run a message loop or wait for an event to keep the application running
        // For demonstration purposes, we'll just pause here
        Console.WriteLine("Press any key to exit...");
        Console.ReadKey();

        UnhookWindowsHookEx(hook);
    }
}
