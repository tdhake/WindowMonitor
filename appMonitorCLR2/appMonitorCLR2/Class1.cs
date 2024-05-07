using System;
using System.Runtime.InteropServices;

namespace appMonitorCLR2
{
    public class User32Interop
    {
        // Constants for Windows messages
        public const int WM_ACTIVATE = 0x0006;
        public const int WM_DESTROY = 0x0002;
        public const int WM_SETFOCUS = 0x0007;

        // Delegate for the callback function
        public delegate IntPtr HookProc(int code, IntPtr wParam, IntPtr lParam);

        // Import necessary functions from user32.dll
        [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
        public static extern IntPtr SetWindowsHookEx(int idHook, HookProc lpfn, IntPtr hMod, uint dwThreadId);

        [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
        [return: MarshalAs(UnmanagedType.Bool)]
        public static extern bool UnhookWindowsHookEx(IntPtr hhk);

        [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
        public static extern IntPtr CallNextHookEx(IntPtr hhk, int nCode, IntPtr wParam, IntPtr lParam);
    }

    public class ForegroundAppMonitor
    {
        private User32Interop.HookProc hookProc;
        private IntPtr hookId = IntPtr.Zero;

        public void StartMonitoring()
        {
            hookProc = HookCallback;
            hookId = User32Interop.SetWindowsHookEx(User32Interop.WM_SETFOCUS, hookProc, IntPtr.Zero, (uint)AppDomain.GetCurrentThreadId());
        }

        public void StopMonitoring()
        {
            User32Interop.UnhookWindowsHookEx(hookId);
        }

        private IntPtr HookCallback(int code, IntPtr wParam, IntPtr lParam)
        {
            if (code >= 0)
            {
                // Handle the hook event here
                int msg = wParam.ToInt32();
                if (msg == User32Interop.WM_SETFOCUS)
                {
                    // Foreground window changed
                    Console.WriteLine("Foreground window changed.");
                }
                else if (msg == User32Interop.WM_DESTROY)
                {
                    // App is terminating
                    Console.WriteLine("Application is terminating.");
                }
            }

            return User32Interop.CallNextHookEx(hookId, code, wParam, lParam);
        }
    }
    }