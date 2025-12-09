/**
 * 부모, 현재, 자식, 부모의 iframe들에게 MessageEvent 전파
 * @param {string} eventType - 이벤트 타입 (예: "fire-message")
 * @param {object} params - 전달할 데이터 객체
 */
function sendEventAll(eventType, params) {
  // 1. 부모 윈도우에 이벤트 전달
  if (window.parent !== window) {
    try {
      parent.window.dispatchEvent(new MessageEvent(eventType, { data: params }));
      
      // 부모의 모든 iframe들에게도 이벤트 전달
      const parentFrames = parent.document.querySelectorAll("iframe");
      parentFrames.forEach((frame) => {
        try {
          frame.contentWindow.dispatchEvent(new MessageEvent(eventType, { data: params }));
        } catch (e) {
          console.warn("부모의 iframe 접근 불가:", e);
        }
      });
    } catch (e) {
      console.warn("부모 윈도우 접근 불가:", e);
    }
  }

  // 2. 현재 윈도우에 이벤트 전달
  window.dispatchEvent(new MessageEvent(eventType, { data: params }));

  // 3. 자식 iframe들에게 이벤트 전달
  const frames = document.querySelectorAll("iframe");
  frames.forEach((frame) => {
    try {
      frame.contentWindow.dispatchEvent(new MessageEvent(eventType, { data: params }));
    } catch (e) {
      console.warn("자식 iframe 접근 불가:", e);
    }
  });
}

// 사용
sendEventAll("fire-message", { actcd: "click" });