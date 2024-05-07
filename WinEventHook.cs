using System;
using System.Runtime.InteropServices;

public class Startup
{
    public const int EVENT_SYSTEM_FOREGROUND = 3;
    public const uint WINEVENT_OUTOFCONTEXT = 0;

    public delegate void WinEventDelegate(IntPtr hWinEventHook, uint eventType, IntPtr hwnd, int idObject, int idChild, uint dwEventThread, uint dwmsEventTime);

    public static WinEventDelegate eventDelegate;
    public static IntPtr hook;

    public static void StartHook()
    {
        eventDelegate = new WinEventDelegate(WinEventCallback);
        hook = SetWinEventHook(EVENT_SYSTEM_FOREGROUND, EVENT_SYSTEM_FOREGROUND, IntPtr.Zero, eventDelegate, 0, 0, WINEVENT_OUTOFCONTEXT);
    }

    public static void StopHook()
    {
        if (hook != IntPtr.Zero)
        {
            UnhookWinEvent(hook);
            hook = IntPtr.Zero;
        }
    }

    public static void WinEventCallback(IntPtr hWinEventHook, uint eventType, IntPtr hwnd, int idObject, int idChild, uint dwEventThread, uint dwmsEventTime)
    {
        Console.WriteLine("Foreground window changed!");
        // You can add more logic here to handle the event
    }

    [DllImport("user32.dll")]
    public static extern IntPtr SetWinEventHook(int eventMin, int eventMax, IntPtr hmodWinEventProc, WinEventDelegate lpfnWinEventProc, uint idProcess, uint idThread, uint dwFlags);

    [DllImport("user32.dll")]
    public static extern bool UnhookWinEvent(IntPtr hWinEventHook);
}
