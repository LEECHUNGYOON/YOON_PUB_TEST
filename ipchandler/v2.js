const REMOTE = require('@electron/remote');
const IPCMAIN = REMOTE.require('electron').ipcMain;
const IPCRENDERER = require('electron').ipcRenderer;

// 타임스탬프 중복 방지용 카운터
let callbackId = 0;

// 이벤트 핸들러를 관리하는 Map
const handlerMap = new Map();

/**
 * 이벤트 전송 (Send)
 * * @returns {Function} 리스너 제거 함수 (더 이상 응답을 받지 않을 때 호출)
 */
function send(channel, params, callback) {

  // 1. 단방향 통신 (Callback 없음)
  if (typeof callback !== 'function') {
    IPCRENDERER.send(channel, { params });
    // 단방향은 해제할 게 없으므로 빈 함수 반환
    return () => {};
  }

  // 2. 양방향 통신
  // 고유 채널 ID 생성
  const replyChannel = `${channel}:reply:${Date.now()}_${callbackId++}`;

  const responseHandler = (event, data) => {
    callback(event, data);
  };

  // N개의 응답을 받기 위해 on 사용 (계속 열어둠)
  IPCRENDERER.on(replyChannel, responseHandler);

  // Main으로 요청 전송
  IPCRENDERER.send(channel, {
    __replyChannel: replyChannel,
    params: params
  });

  // [핵심] 리스너를 제거하는 함수를 반환합니다.
  // 사용자는 원하는 시점(모든 응답 수신 후)에 이 함수를 실행해야 합니다.
  return function stopListening() {
    IPCRENDERER.removeListener(replyChannel, responseHandler);
  };
}

/**
 * 이벤트 수신 (On)
 */
function on(channel, handler) {
  if (handlerMap.has(handler)) {
    return;
  }

  const listener = (event, message) => {
    const { __replyChannel, params } = message || {};

    event.reply = (data) => {
      // 응답 채널 없으면 중단
      if (!__replyChannel) {
        return;
      }
      // 요청자에게 직접 응답
      event.sender.send(__replyChannel, data);
    };

    handler(event, params);
  };

  handlerMap.set(handler, listener);
  IPCMAIN.on(channel, listener);
}

/**
 * 리스너 제거 (Off)
 */
function off(channel, handler) {
  const listener = handlerMap.get(handler);

  if (!listener) {
    return;
  }

  IPCMAIN.removeListener(channel, listener);
  handlerMap.delete(handler);
}

module.exports = { send, on, off };