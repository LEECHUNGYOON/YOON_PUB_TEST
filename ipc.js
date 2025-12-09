


function sendEventAll(cannelId, params, callback){

    ipcrenderer.send(cannelId, params);

    if(typeof callback === "function"){
        ipcmain.once(cannelId, callback);
    }

}

function onIpcEvent(cannelId, callback){
    ipcmain.on(cannelId, callback);
}


/**
 * 단방향 전송 및 수신
 */
sendEvent('active', { scope: "main" });

onIpcEvent('active', (oEvent, oParams) => {
    // 로직...
});



/**
 * 양방향 통신
 */
sendEvent('active', { scope: "main" }, (oEvent, oParams) => {

    // 콜백 대기..

});

// 이벤트 수신받고 전송처 호출시
onIpcEvent('active', (oEvent, oParams) => {

    // 수신처에 다시 호출.. 어떤 방법으로?

});


















class ipcEventHandler {

    constructor(){

    }

    send(){

    }

    on (){


    }

}