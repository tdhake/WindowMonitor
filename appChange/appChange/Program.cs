using System;
using System.Runtime.InteropServices;
using System.Text;
using System.Windows.Forms;
using static System.Net.Mime.MediaTypeNames;

class ForegroundAppMonitor : Form
{
    private delegate void WinEventDelegate(IntPtr hWinEventHook, uint eventType, IntPtr hwnd, int idObject, int idChild, uint dwEventThread, uint dwmsEventTime);

    [DllImport("user32.dll")]
    private static extern IntPtr SetWinEventHook(uint eventMin, uint eventMax, IntPtr hmodWinEventProc, WinEventDelegate lpfnWinEventProc, uint idProcess, uint idThread, uint dwFlags);

    private const uint WINEVENT_OUTOFCONTEXT = 0;
    private const uint EVENT_SYSTEM_FOREGROUND = 3;

    private WinEventDelegate _winEventDelegate;
    private IntPtr _winEventHook;

    public ForegroundAppMonitor()
    {
        _winEventDelegate = new WinEventDelegate(WinEventProc);
        _winEventHook = SetWinEventHook(EVENT_SYSTEM_FOREGROUND, EVENT_SYSTEM_FOREGROUND, IntPtr.Zero, _winEventDelegate, 0, 0, WINEVENT_OUTOFCONTEXT);
    }

    protected override void OnClosed(EventArgs e)
    {
        UnhookWinEvent(_winEventHook);
        base.OnClosed(e);
    }

    [DllImport("user32.dll")]
    private static extern bool UnhookWinEvent(IntPtr hWinEventHook);

    private void WinEventProc(IntPtr hWinEventHook, uint eventType, IntPtr hwnd, int idObject, int idChild, uint dwEventThread, uint dwmsEventTime)
    {
        Console.WriteLine("Foreground window changed");
        // Here you can add code to handle the event, like getting the window title etc.
    }

    [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
    private static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);

    [DllImport("user32.dll", SetLastError = true)]
    private static extern IntPtr GetForegroundWindow();

    private string GetActiveWindowTitle()
    {
        IntPtr hwnd = GetForegroundWindow();
        StringBuilder sb = new StringBuilder(256);
        if (GetWindowText(hwnd, sb, sb.Capacity) > 0)
        {
            return sb.ToString();
        }
        return string.Empty;
    }

    static void Main()
    {
        Application.Run(new ForegroundAppMonitor());
    }
}
