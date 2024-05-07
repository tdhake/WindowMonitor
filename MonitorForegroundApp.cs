using System;
using System.Diagnostics;
using System.Runtime.InteropServices;

public class Startup
{
    public delegate void WinEventDelegate(IntPtr hWinEventHook, uint eventType, IntPtr hwnd, int idObject, int idChild, uint dwEventThread, uint dwmsEventTime);

    [DllImport("user32.dll")]
    public static extern IntPtr SetWinEventHook(uint eventMin, uint eventMax, IntPtr hmodWinEventProc, WinEventDelegate lpfnWinEventProc, uint idProcess, uint idThread, uint dwFlags);

    [DllImport("user32.dll")]
    public static extern bool UnhookWinEvent(IntPtr hWinEventHook);

    const uint WINEVENT_OUTOFCONTEXT = 0;
    const uint EVENT_SYSTEM_FOREGROUND = 3;
    const uint EVENT_SYSTEM_CAPTURESTART = 8;

    public async System.Threading.Tasks.Task<object> Invoke(dynamic input)
    {
        Console.WriteLine("In Tasks");
        WinEventDelegate dele = WinEventProc;
        // new WinEventDelegate(WinEventProc);
        Console.WriteLine("delegate instantiated");

        IntPtr hhook = SetWinEventHook(EVENT_SYSTEM_CAPTURESTART, EVENT_SYSTEM_CAPTURESTART, IntPtr.Zero, dele, 0, 0, WINEVENT_OUTOFCONTEXT);
        Console.WriteLine("event hooked");

        // To keep the hook alive, delay for a while.
        await System.Threading.Tasks.Task.Delay(TimeSpan.FromMinutes(10));
        Console.WriteLine("Delay over");

        //UnhookWinEvent(hhook);

        return null;
    }

    public void WinEventProc(IntPtr hWinEventHook, uint eventType, IntPtr hwnd, int idObject, int idChild, uint dwEventThread, uint dwmsEventTime)
    {
        Console.WriteLine("WinEventProc");
        if (eventType == EVENT_SYSTEM_CAPTURESTART)
        {
            int pid;
            GetWindowThreadProcessId(hwnd, out pid);
            var proc = Process.GetProcessById(pid);
            Console.WriteLine("EVENT_SYSTEM_CAPTURESTART", proc.MainWindowTitle);
        }
    }

    [DllImport("user32.dll")]
    private static extern uint GetWindowThreadProcessId(IntPtr hWnd, out int lpdwProcessId);
}
