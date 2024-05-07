const ffi = require("ffi-napi")
// const cluster = require("cluster")
const ref = require("ref-napi")
const wchar = require("ref-wchar-napi")
const struct = require('ref-struct-di')(ref);
const activeApp = require("active-win");

// var lpdwordPtr = ref.refType(ref.types.ulong);

// if (cluster.isMaster) {
//     console.log("Main code here...")
//     cluster.fork()
// } else {
    const msgType = ref.types.void
    const msgPtr = ref.refType(msgType)
    // const lpdword = ref.types.uint32
    // const lpdwordPtr = Buffer.alloc(4)//ref.refType(lpdword)
    // lpdwordPtr.type = ref.types.uint32
    const EVENT_SYSTEM_FOREGROUND = 3
    // const EVENT_SYSTEM_DRAGDROPEND = 6
    //const EVENT_OBJECT_LOCATIONCHANGE = 2048
    const EVENT_SYSTEM_MINIMIZESTART = 22
    const EVENT_SYSTEM_MINIMIZEEND = 23
    const EVENT_SYSTEM_MOVESIZEEND = 11    
    const EVENT_SYSTEM_MOVESIZESTART = 10
    const WINEVENT_OUTOFCONTEXT = 0
    const WINEVENT_INCONTEXT = 4
    const WINEVENT_SKPIOWNPROCESS = 2
    const WINEVENT_SKIPOWNTHREAD = 1
    const MAX_PATH = 512
    const WM_SIZE = 5
    const SIZE_MAXIMIZED = 2
    const SIZE_RESTORED = 1
    const EVENT_OBJECT_VALUECHANGE = 32782
    const EVENT_OBJECT_STATECHANGE = 32778
    const EVENT_SYSTEM_DRAGDROPEND = 15
    const EVENT_SYSTEM_CAPTURESTART = 8;

    let windowWidth, windowHeight;

    const handleType = ref.types.void
    var handlePtr = ref.refType(msgType)
    handlePtr.types = ref.types.void

    // Define the WINDOWPLACEMENT structure
    const WINDOWPLACEMENT = struct({
        length: 'uint32',
        flags: 'uint32',
        showCmd: 'uint32',
        ptMinPosition: 'long',
        ptMaxPosition: 'long',
        rcNormalPosition: 'long',
    });

    const user32 = ffi.Library("user32", {
        SetWinEventHook: ["int", ["int", "int", "pointer", "pointer", "int", "int", "int"]],
        GetWindowTextW: ["int", ["pointer", "pointer", "int"]],
        GetWindowTextLengthW: ["int", ["pointer"]],
        GetMessageA: ["bool", [msgPtr, "int", "uint", "uint"]],
        // GetWindowThreadProcessId:['int', ['pointer', lpdwordPtr.type/*ref.refType(lpdword)*/]],
        //GetWindowPlacement: ["void", ["pointer", "pointer"]]
        GetWindowRect: ["bool", ['long', 'pointer']],
        // GetForegroundWindow: ["long", []],
        // ShowWindow: ["bool", ["long", "int"]],
        // SetWindowPos: ["bool", ["long", "long", "int", "int", "int", "int", "uint"]]
        GetWindowThreadProcessId: ["int", ["pointer"]],
        IsZoomed: ['bool', ['long']],
        GetWindowPlacement: ['bool', ['long', WINDOWPLACEMENT]],
        GetForegroundWindow: ['long', []],
        GetWindowTextA: ['int', ['long', 'string', 'int']]
    })

    const oleacc = ffi.Library("Oleacc", {
        GetProcessHandleFromHwnd: ["pointer", ["pointer"]]
    });

    const psapi = ffi.Library("psapi", {
        GetProcessImageFileNameW: ["int", ["pointer", "pointer", "int"]]
    })

    function getMessage() {
        console.log('Message - ', msgPtr);
        return user32.GetMessageA(ref.alloc(msgPtr), null, 0, 0)
    }

    const pfnWinEventProc = ffi.Callback("void", ["pointer", "int", "pointer", "long", "long", "int", "int"],
        function (hWinEventHook, event, hwnd, idObject, idChild, idEventThread, dwmsEventTime) {
            // Getting window title
            const windowTitleLength = user32.GetWindowTextLengthW(hwnd)
            const bufferSize = windowTitleLength * 2 + 4
            const titleBuffer = Buffer.alloc(bufferSize)
            user32.GetWindowTextW(hwnd, titleBuffer, bufferSize)
            const titleText = ref.reinterpretUntilZeros(titleBuffer, wchar.size)
            const finallyWindowTitle = wchar.toString(titleText)

            
            try{
                var processNameBuffer = Buffer.alloc((MAX_PATH*2)+2)
                handlePtr = oleacc.GetProcessHandleFromHwnd(hwnd);
                psapi.GetProcessImageFileNameW(handlePtr, processNameBuffer, MAX_PATH*2);
                const processNameText = ref.reinterpretUntilZeros(processNameBuffer, wchar.size)
                const finalProcessNameText = wchar.toString(processNameText)
                
                const pid = user32.GetWindowThreadProcessId(hwnd);
                if(finallyWindowTitle != 'Running applications'){
                    console.log('Event - ', event, ` Data -${finalProcessNameText}-${finallyWindowTitle}-`);
                    console.log("Process ID: ", pid);
                }

                // var lpdwordPtr = ref.refType(ref.types.lpdword);
                // var pid = ref.alloc(ref.types.uint32);
                
                // const thread = user32.GetWindowThreadProcessId(hwnd, pid);
                // console.log('Got message from thread-', thread);
                // console.log(pid.deref(), ' - ', pid, ' - ', finallyWindowTitle);

                //console.log("checking location")

               // Check if the window is restored down
                const placement = new WINDOWPLACEMENT();
                placement.length = WINDOWPLACEMENT.size;
                user32.GetWindowPlacement(hwnd, placement.ref());
                
                // console.log('currentWindowTitle', currentWindowTitle);

                if (
                    // (event === EVENT_OBJECT_STATECHANGE || event === EVENT_SYSTEM_CAPTURESTART || )
                    // && currentWindowTitle != finallyWindowTitle
                    finallyWindowTitle != 'Running applications'
                    ) {
                    // console.log('IsZoomed', user32.IsZoomed(hwnd));
                    // console.log('placement.showCmd', placement.showCmd);
                    // console.log("Window size/position is changed")
                    // create rectangle from pointer
                    const pointerToRect = function (rectPointer) {
                        return {
                            left: rectPointer.readInt16LE(0),
                            top: rectPointer.readInt16LE(4),
                            right: rectPointer.readInt16LE(8),
                            bottom: rectPointer.readInt16LE(12)
                        };
                    }
                    
                    // obtain window dimension
                    const getWindowDimensions = function (handle) {
                        const rectPointer = Buffer.alloc(16);
                        const getWindowRect = user32.GetWindowRect(handle, rectPointer);
                        return !getWindowRect ? null : pointerToRect(rectPointer);
                    }
                    
                    // Check if the function succeeded
                    const activeWindowDimensions = getWindowDimensions(ref.address(hwnd));
                    
                    function displayCurrentTime() {
                        const now = new Date();
                        const hours = now.getHours().toString().padStart(2, '0');
                        const minutes = now.getMinutes().toString().padStart(2, '0');
                        const seconds = now.getSeconds().toString().padStart(2, '0');
                        const formattedTime = `${hours}:${minutes}:${seconds}`;
                        return formattedTime;
                    }

                    if (activeWindowDimensions) {  
                        // get active window width and height
                        const activeWindowWidth = activeWindowDimensions.right - activeWindowDimensions.left;
                        const activeWindowHeight = activeWindowDimensions.bottom - activeWindowDimensions.top;
                        if(windowHeight != activeWindowHeight || windowWidth != activeWindowWidth){
                            windowHeight = activeWindowHeight;
                            windowWidth = activeWindowWidth;
                            console.log(displayCurrentTime(), "Window's current position: ")
                            console.log(activeWindowDimensions);
                            console.log(`Window's current width is ${activeWindowWidth}, Window's current height is ${activeWindowHeight}`);}
                            console.log('**************************************');
                    } else {
                        // Print an error message to the console
                        console.error('GetWindowRect failed');
                    }
                }
            }   catch(e)    {
                console.log('Exception - ', e);
            }
        }
    )

    // user32.SetWinEventHook(EVENT_SYSTEM_MOVESIZESTART, EVENT_SYSTEM_MOVESIZESTART, null, pfnWinEventProc,
    //     0, 0, WINEVENT_OUTOFCONTEXT | WINEVENT_SKPIOWNPROCESS);
    
    // user32.SetWinEventHook(EVENT_SYSTEM_FOREGROUND, EVENT_SYSTEM_FOREGROUND, null, pfnWinEventProc,
    //     0, 0, WINEVENT_OUTOFCONTEXT | WINEVENT_SKPIOWNPROCESS);

    user32.SetWinEventHook(EVENT_OBJECT_STATECHANGE, EVENT_OBJECT_STATECHANGE, null, pfnWinEventProc, 0, 0, WINEVENT_OUTOFCONTEXT | WINEVENT_SKPIOWNPROCESS);

    // user32.SetWinEventHook(
    //     EVENT_SYSTEM_CAPTURESTART,
    //     EVENT_SYSTEM_CAPTURESTART,
    //     null,
    //     pfnWinEventProc,
    //     0,
    //     0,
    //     WINEVENT_OUTOFCONTEXT | WINEVENT_SKPIOWNPROCESS,
    // );

    // const hwnd = user32.GetForegroundWindow();
    // console.log('IsZoomed - ', user32.IsZoomed(hwnd));

    // const placement = new WINDOWPLACEMENT();
    // placement.length = WINDOWPLACEMENT.size;
    // user32.GetWindowPlacement(hwnd, placement.ref());
    // console.log('placement.showCmd - ', placement.showCmd);

    let res = getMessage()
    // while(res != 0) {
    //     switch (res) {
    //         case -1:
    //             console.log("Invalid GetMessageA arguments or something!");
    //             break
    //         default:
    //             console.log("Got a message!")
    //     }
    //     res = getMessage()
    // }
// }


// import { alloc, types, Value } from 'ref-napi';
// import { Library } from 'ffi-napi';

// const lib = Library('libmy', {
//   test1: ['int', []],
//   test2: ['int', ['int*']]
// });

// const res1 = lib.test1();
// console.log(`test1() returned ${res1}`);

// const res2: Value<number> = alloc(types.int);
// lib.test2(res2 as any);

// console.log(`test2() returned ${res2.deref()}`);