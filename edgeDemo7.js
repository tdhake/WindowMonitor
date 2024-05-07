const edge = require('edge-js');

const messageMonitor = edge.func({
    source: `
       
        using System.Threading.Tasks;

        ${require('fs').readFileSync('./MessageMonitor.cs', 'utf8')}
    `,
    references: ['System.Windows.Forms.dll'],
});

async function main() {
    // Show the message box and wait
    await messageMonitor.ShowMessageBoxAndWait(null);

    // Monitor the window
    await messageMonitor.MonitorWindow(null);
}

main().catch(console.error);
