var edge = require('edge-js');

var helloWorld = edge.func({
    source: function() { /* 
        using System;
        using System.Threading.Tasks;
        namespace Example
        {
          public class Greetings
          {
            public async Task<object> Greet()
            {
              return String.Format("On {0}",
                System.DateTime.Now);
            }
          }
        }
 */},
 references: [ 'System.dll', 'System.Threading.Tasks.dll' ]
});

helloWorld(null, function(error, result) {
    if (error) throw error;
    console.log(result);
});
