using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Text;
using System.Windows.Forms;

namespace RegisterShellHook
{
    public static class Interop
    {
        public enum ShellEvents : int
        {
            HSHELL_WINDOWCREATED = 1,
            HSHELL_WINDOWDESTROYED = 2,
            HSHELL_ACTIVATESHELLWINDOW = 3,
            HSHELL_WINDOWACTIVATED = 4,
            HSHELL_GETMINRECT = 5,
            HSHELL_REDRAW = 6,
            HSHELL_TASKMAN = 7,
            HSHELL_LANGUAGE = 8,
            HSHELL_ACCESSIBILITYSTATE = 11,
            HSHELL_APPCOMMAND = 12
        }
        [DllImport("user32.dll", EntryPoint = "RegisterWindowMessageA", CharSet = CharSet.Ansi, SetLastError = true, ExactSpelling = true)]
        public static extern int RegisterWindowMessage(string lpString);
        [DllImport("user32", CharSet = CharSet.Ansi, SetLastError = true, ExactSpelling = true)]
        public static extern int DeregisterShellHookWindow(IntPtr hWnd);
        [DllImport("user32", CharSet = CharSet.Ansi, SetLastError = true, ExactSpelling = true)]
        public static extern int RegisterShellHookWindow(IntPtr hWnd);
        [DllImport("user32", EntryPoint = "GetWindowTextA", CharSet = CharSet.Ansi, SetLastError = true, ExactSpelling = true)]
        public static extern int GetWindowText(IntPtr hwnd, System.Text.StringBuilder lpString, int cch);
        [DllImport("user32", EntryPoint = "GetWindowTextLengthA", CharSet = CharSet.Ansi, SetLastError = true, ExactSpelling = true)]
        public static extern int GetWindowTextLength(IntPtr hwnd);
    }

    public class SystemProcessHookForm : Form
    {
        private readonly int msgNotify;
        public delegate void EventHandler(object sender, string data);
        public event EventHandler WindowEvent;
        protected virtual void OnWindowEvent(string data)
        {
            var handler = WindowEvent;
            if (handler != null)
            {
                handler(this, data);
            }
        }

        public SystemProcessHookForm()
        {
            // Hook on to the shell
            msgNotify = Interop.RegisterWindowMessage("SHELLHOOK");
            Interop.RegisterShellHookWindow(this.Handle);
        }

        protected override void WndProc(ref Message m)
        {
            if (m.Msg == msgNotify)
            {
                // Receive shell messages
                switch ((Interop.ShellEvents)m.WParam.ToInt32())
                {
                    case Interop.ShellEvents.HSHELL_WINDOWCREATED:
                    case Interop.ShellEvents.HSHELL_WINDOWDESTROYED:
                    case Interop.ShellEvents.HSHELL_WINDOWACTIVATED:
                        string wName = GetWindowName(m.LParam);
                        var action = (Interop.ShellEvents)m.WParam.ToInt32();
                        OnWindowEvent(string.Format("{0} - {1}: {2}", action, m.LParam, wName));
                        break;
                }
            }
            base.WndProc(ref m);
        }

        private string GetWindowName(IntPtr hwnd)
        {
            StringBuilder sb = new StringBuilder();
            int longi = Interop.GetWindowTextLength(hwnd) + 1;
            sb.Capacity = longi;
            Interop.GetWindowText(hwnd, sb, sb.Capacity);
            return sb.ToString();
        }

        protected override void Dispose(bool disposing)
        {
            try { Interop.DeregisterShellHookWindow(this.Handle); }
            catch { }
            base.Dispose(disposing);
        }
    }

    public class Class1
    {
        static void Main(string[] args)
        {
            var f = new SystemProcessHookForm();
            f.WindowEvent += (sender, data) => Console.WriteLine(data);
            while (true)
            {
                Application.DoEvents();
            }
        }
    }

}
