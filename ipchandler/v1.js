const REMOTE = require('@electron/remote');
const IPCMAIN = REMOTE.require('electron').ipcMain;
const IPCRENDERER = require('electron').ipcRenderer;

// 콜백 ID 관리 및 핸들러 매핑
let callbackId = 0;

// 이벤트 핸들러를 관리하는 Map
const handlerMap = new Map();

/**
 * 이벤트 전송 (Send)
 * - 내 창(Renderer) -> Main -> 다른 창(Renderer)
 */
function send(channel, params, callback) {
  // 1. 단방향 통신 (Callback 없음) -> 전송 후 바로 종료
  if (typeof callback !== 'function') {
    IPCRENDERER.send(channel, { params });
    return;
  }

  // 2. 양방향 통신 (Callback 있음)
  // 고유한 응답 채널 생성 (충돌 방지를 위해 난수 포함)
  const replyChannel = `${channel}:reply:${Date.now()}:${callbackId++}`;

  // 응답은 '내 창(ipcRenderer)'으로 돌아옵니다.
  // (제공해주신 소스 그대로 once 사용)
  IPCRENDERER.once(replyChannel, (event, data) => {
    callback(event, data);
  });

  // Main으로 전송
  IPCRENDERER.send(channel, {
    __replyChannel: replyChannel,
    params: params
  });
}

/**
 * 이벤트 수신 (On)
 * - ipcMain에 등록하므로, 어떤 창에서 보내든 다 받을 수 있습니다.
 */
function on(channel, handler) {
  // 중복 등록 방지 (Early Return)
  if (handlerMap.has(handler)) {
    return;
  }

  const listener = (event, message) => {
    const { __replyChannel, params } = message || {};

    // [핵심] event 객체에 reply 함수 주입
    event.reply = (data) => {
      // 응답 채널이 없으면 실행하지 않음 (Early Return)
      if (!__replyChannel) {
        return;
      }
      
      // 요청을 보낸 그 창(Renderer)으로 정확히 응답 전송
      event.sender.send(__replyChannel, data);
    };

    handler(event, params);
  };

  // 나중에 off를 하기 위해 저장
  handlerMap.set(handler, listener);

  // Main Process에 리스너 등록
  IPCMAIN.on(channel, listener);
}

/**
 * 리스너 제거 (Off)
 */
function off(channel, handler) {
  const listener = handlerMap.get(handler);

  // 등록된 리스너가 없으면 바로 종료 (Early Return)
  if (!listener) {
    return;
  }

  IPCMAIN.removeListener(channel, listener);
  handlerMap.delete(handler);
}

module.exports = { send, on, off };