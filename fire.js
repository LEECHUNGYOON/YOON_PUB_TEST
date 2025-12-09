/**
 * 부모, 현재, 자식, 부모의 iframe들에게 MessageEvent 전파
 * @param {string} eventType - 이벤트 타입 (예: "fire-message")
 * @param {object} params - 전달할 데이터 객체
 */
function sendEventAll(eventType, params) {

  const oEvent = new MessageEvent(eventType, { data: params });

    // 1. 부모 윈도우에 이벤트 전달
    if (window.parent !== window) {

        try {
            parent.window.dispatchEvent(oEvent);

            // 부모의 모든 iframe들에게도 이벤트 전달
            const aParentFrames = parent.document.querySelectorAll("iframe");
            aParentFrames.forEach((oFrame) => {
                try {
                    oFrame.contentWindow.dispatchEvent(oEvent);
                } catch (oError) {
                    console.warn("부모의 iframe 접근 불가:", oError);
                }
            });

        } catch (oError) {
            console.warn("부모 윈도우 접근 불가:", oError);
        }
    }

    // 2. 현재 윈도우에 이벤트 전달
    window.dispatchEvent(oEvent);

    // 3. 자식 iframe들에게 이벤트 전달
    const aFrames = document.querySelectorAll("iframe");
    aFrames.forEach((oFrame) => {

        try {
            oFrame.contentWindow.dispatchEvent(oEvent);
        } catch (oError) {
            console.warn("자식 iframe 접근 불가:", oError);
        }
        
    });

}
// 사용
sendEventAll("fire-message", { actcd: "click" });