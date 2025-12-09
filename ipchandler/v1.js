/**
 * Electron Remote 기반 IPC 유틸리티 (Hub 방식)
 * - 원리: 모든 통신은 Main 프로세스(ipcMain)를 거쳐서 라우팅됩니다.
 * - 장점: 송신자/수신자가 서로 누군지 몰라도 채널만 맞으면 통신 가능.
 */

const REMOTE = require('@electron/remote');

// 수신용: 전역 허브인 Main 프로세스에 리스너를 등록
const IPCMAIN = REMOTE.require('electron').ipcMain;

// 송신용: 현재 창에서 신호를 보냄
const IPCRENDERER = require('electron').ipcRenderer;

// 콜백 ID 관리 및 핸들러 매핑
let callbackId = 0;

const handlerMap = new Map();

/**
 * 이벤트 전송 (Send)
 * - 내 창(Renderer) -> Main -> 다른 창(Renderer)
 */
function send(channel, params, callback) {

	if (typeof callback === 'function') {

		// 1. 양방향 통신 (응답 대기)
		// 고유한 응답 채널 생성 (충돌 방지를 위해 난수 포함)
		const replyChannel = `${channel}:reply:${Date.now()}:${callbackId++}`;

		// 응답은 '내 창(ipcRenderer)'으로 돌아옵니다.
		IPCRENDERER.once(replyChannel, (event, data) => {
			callback(event, data);
		});

		// Main으로 전송
		IPCRENDERER.send(channel, {
			__replyChannel: replyChannel,
			params: params
		});

		return;

	} 

	// 2. 단방향 통신
	IPCRENDERER.send(channel, { params: params });  

}

/**
 * 이벤트 수신 (On)
 * - ipcMain에 등록하므로, 어떤 창에서 보내든 다 받을 수 있습니다.
 */
function on(channel, handler) {

	// 중복 등록 방지 (같은 핸들러가 여러 번 등록되는 것 막기)
	if (handlerMap.has(handler)) return;

	const listener = (event, message) => {
	const { __replyChannel, params } = message || {};

	// [핵심] event 객체에 reply 함수 주입
	// remote를 통해 전달된 event 객체는 내부적으로 sender(보낸 사람) 정보를 가지고 있습니다.
	event.reply = function(data) {

		if (__replyChannel) {

			// event.sender.send를 호출하면, 요청을 보낸 그 창(Renderer)으로 정확히 응답이 갑니다.
			event.sender.send(__replyChannel, data);

		}

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
	if (listener) {
		IPCMAIN.removeListener(channel, listener);
		handlerMap.delete(handler);
	} else {
		// 혹시 모를 안전장치: 핸들러 없이 호출하면 해당 채널 전체 삭제 (필요시 주석 처리)
		// IPCMAIN.removeAllListeners(channel);
	}
}

module.exports = { send, on, off };