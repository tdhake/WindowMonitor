var edge = require('edge-js');

var addFunc = edge.func(`
    async (dynamic input) => {
        int x = (int)input.x;
        int y = (int)input.y;
        int result = x + y;

        return result;
    }
`);

var params = { x: 10, y: 20 };

addFunc(params, function (error, result) {
    if (error) throw error;
    console.log(result);
});
