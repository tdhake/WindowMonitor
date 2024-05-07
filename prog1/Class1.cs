using System;

namespace prog1
{
    public class Class1
    {
        [DllExport]
        public static int Add(int a, int b)
        {
            return a + b;
        }
    }
}

