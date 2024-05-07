const edge = require('edge-js');

const monitorForegroundAppChange = edge.func({
    source: `
        using System;
        using System.Diagnostics;
        using System.Runtime.InteropServices;

        public class Startup
        {
            private delegate void WinEventDelegate(IntPtr hWinEventHook, uint eventType, IntPtr hwnd, int idObject, int idChild, uint dwEventThread, uint dwmsEventTime);

            [DllImport("user32.dll")]
            private static extern IntPtr SetWinEventHook(uint eventMin, uint eventMax, IntPtr hmodWinEventProc, WinEventDelegate lpfnWinEventProc, uint idProcess, uint idThread, uint dwFlags);

            [DllImport("user32.dll")]
            private static extern bool UnhookWinEvent(IntPtr hWinEventHook);

            private const uint WINEVENT_OUTOFCONTEXT = 0;
            private const uint EVENT_SYSTEM_FOREGROUND = 3;

            public async System.Threading.Tasks.Task<object> Invoke(dynamic input)
            {
                WinEventDelegate dele = new WinEventDelegate(WinEventProc);

                IntPtr hhook = SetWinEventHook(EVENT_SYSTEM_FOREGROUND, EVENT_SYSTEM_FOREGROUND, IntPtr.Zero, dele, 0, 0, WINEVENT_OUTOFCONTEXT);

                // To keep the hook alive, delay for a while.
                await System.Threading.Tasks.Task.Delay(TimeSpan.FromMinutes(1));

                UnhookWinEvent(hhook);

                return null;
            }

            private void WinEventProc(IntPtr hWinEventHook, uint eventType, IntPtr hwnd, int idObject, int idChild, uint dwEventThread, uint dwmsEventTime)
            {
                Console.WriteLine("Hook set up successfully");
                if (eventType == EVENT_SYSTEM_FOREGROUND)
                {
                    int pid;
                    GetWindowThreadProcessId(hwnd, out pid);
                    var proc = Process.GetProcessById(pid);
                    Console.WriteLine(proc.MainWindowTitle);
                }
            }

            [DllImport("user32.dll")]
            private static extern uint GetWindowThreadProcessId(IntPtr hWnd, out int lpdwProcessId);
        }
    `
});

monitorForegroundAppChange(null, function (error, result) {
    if (error) throw error;
});
