var edge = require('edge-js');

var mathLibrary = edge.func({
    assemblyFile: "./prog1.dll",
    typeName: "prog1.Class1",
    methodName: "Add" 
});

let inputParams = { x: 10, y: 20 };

mathLibrary(inputParams, function(error, result) {
    if (error) throw error;
    console.log(result);
});
