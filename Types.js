const APP_MONITORING_CONSTANTS = {
     // * App focus event
     APP_FOCUS: "APP-FOCUSED",

     // * App blur (lost focus) event
     APP_BLUR: "APP-BLUR",

     // * App monitor err event
     APP_MONITOR_ERR: "APP-MONITOR-ERR",

     // * App pos change event
     APP_POS_CHANGE: "APP-POS-CHANGE",

     APP_POS_FIX: "APP-POS-FIX",

     // * App title change event
     APP_WINDOW_CHANGE: "APP-WINDOW-CHANGE",

     // * App Watcher change event
     APP_CHANGE: "APP-CHANGE",

     // * App title change event
     APP_TITLE_CHANGE: "APP-TITLE-CHANGE",

     // * If pos change is less than this value for any dimension (x, y, w, h) we dont consider it as a pos change
     allowedPosChange: 20,

     SCROLL_EVENT: "SCROLL-EVENT",

     CLICK_EVENT: "CLICK-EVENT",
};

module.exports = APP_MONITORING_CONSTANTS;