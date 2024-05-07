const ffi = require('ffi-napi');
const path = require('path');

// Define the DLL path
// const dllPath = path.join('prog1', 'C:\Users\tdhake\Downloads\windowchange(2)\windowchange\prog1\bin\Debug\net6.0\prog1');

// Define the functions in the DLL
// const lib = ffi.Library('./prog1.dll', {
//     Add: ['int', ['int','int']]
// });

// Call the function
// const res = lib.Add(2,5);

// console.log('Addition result is ', res);

// Import math library
const mathLibrary = new ffi.Library("./MathLibrary", {
    "Subtract": [
        "int", ["int","int"]
    ],
    "Add": [
        "int", ["int","int"]
    ],
    "Random": [
        "int", ["int","int"]
    ]
});

console.log(mathLibrary.Random(1,5));
console.log(mathLibrary.Add(205,200));
console.log(mathLibrary.Subtract(1000, 300));
