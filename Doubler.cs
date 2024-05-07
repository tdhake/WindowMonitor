using System.Runtime.InteropServices;

public class Doubler
{
    [DllImport("Kernel32.dll")]
    public static extern int Double(int value)
    {
        return value * 2;
    }
}
