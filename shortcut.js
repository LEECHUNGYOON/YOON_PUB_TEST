sap.ui.requireSync("u4a/ui/core/CustomData");

PAGE1.addCustomData(new u4a.ui.core.CustomData({ key: "tabindex", value: "0", writeToDom: true }));

(function () {
    "use strict";

    /********************************************************************
     * SHORTCUT LIST
     ********************************************************************/
    let aShortcutList = [

        /*********************************************
         * TEST APP - YLCY_TEST2071
         *********************************************/
        // { key: "F4", ui: getUiId(INPUT3), evtnm: "submit" },
        // { key: "F3", ui: getUiId(INPUT3), evtnm: "valueHelpRequest" },

        // { key: "F8", ui: getUiId(INPUT3), evtnm: "valueHelpRequest" },
        // { key: "F8", ui: getUiId(BUTTON20), evtnm: "press" },
        // { key: "F8", ui: getUiId(BUTTON19), evtnm: "press" },

        // { key: "F8", ui: getUiId(BUTTON18), evtnm: "press" },
        
        { key: "F8", ui: getUiId(BUTTON3), evtnm: "press" },

    ];


    /**
     * @function getUiId
     * @description
     * UI5 컨트롤 인스턴스에서 ID를 안전하게 추출하여 반환한다.
     *
     * @param {sap.ui.core.Control} oUI
     *   ID를 가져올 UI 인스턴스
     *
     * @returns {string}
     *   UI ID 문자열. 유효하지 않으면 빈 문자열 반환.
     */
    function getUiId(oUI) {

        if (!oUI) return "";

        if (typeof oUI.getId !== "function") return "";

        return oUI.getId() || "";
    }


    /**
     * @function buildKeyString
     * @description
     * keydown 이벤트의 `event` 객체로부터 사용자가 입력한 단축키 조합을
     * `"Ctrl+Shift+S"` 와 같은 문자열 형태로 생성하는 함수.
     *
     * 동작 방식:
     * - Ctrl / Shift / Alt 키가 눌렸는지 확인 후 문자열에 포함
     * - 일반 키(e.key)는 한 글자일 경우 대문자로 변환하여 추가
     * - 모든 키 정보를 `"+"` 로 이어붙여 최종 단축키 문자열 생성
     *
     * @param {KeyboardEvent} event
     *   keydown 이벤트 객체. 사용자가 누른 키 정보가 포함된 표준 KeyboardEvent.
     *
     * @returns {string}
     *   예: `"Ctrl+S"`, `"Ctrl+Shift+A"`, `"Alt+F4"`  
     *   조합된 단축키 문자열을 반환
     */
    function buildKeyString(event) {
        const parts = [];

        if (event.ctrlKey) parts.push("Ctrl");
        if (event.shiftKey) parts.push("Shift");
        if (event.altKey) parts.push("Alt");

        const keyName = (event.key.length === 1)
            ? event.key.toUpperCase()
            : event.key;

        parts.push(keyName);

        return parts.join("+");
    }

    /**
     * @function collectUiDomRefs
     * @description
     * UI5 컨트롤 ID 목록을 기반으로 각 UI 인스턴스와 DOM 요소(DomRef)를 수집한다.
     *
     * @param {Array<{ui: string}>} matchList
     *   UI5 컨트롤 ID 정보 목록
     *
     * @returns {Array<{
     *   shot: Object,
     *   ui: sap.ui.core.Control,
     *   dom: HTMLElement
     * }>}
     *   UI 인스턴스 및 DOM 정보 리스트
     */

    function collectUiDomRefs(matchList) {

        const result = [];

        for (const item of matchList) {

            const uiId = item?.ui || "";
            const uiInstance = sap.ui.getCore().byId(uiId);
            if (!uiInstance) continue;

            const domRef = uiInstance.getDomRef();
            if (!domRef) continue;

            result.push({
                shot: item,
                ui: uiInstance,
                dom: domRef
            });
        }

        return result;
    }


    /**
     * @function isVisible
     * @description
     * 지정된 `targetDom` 요소가 특정 기준 영역 `scopeRootDom` 내부에서
     * 실제로 화면에 **보이는 상태인지 판단**하는 함수.
     *
     * 동작 방식:
     * - `targetDom` 자체가 숨김(display:none / visibility:hidden)인지 검사
     * - 이후 부모 요소를 순차적으로 올라가며(`targetDom` → `scopeRootDom`)
     *   하나라도 숨김 상태이면 `false` 반환
     * - 모든 검사를 통과하면 `true` 반환
     *
     * 즉, **targetDom이 scopeRootDom 내부에서 시각적으로 노출 가능한 상태인지 확인**하는 유틸리티.
     *
     * @param {HTMLElement} targetDom
     *   가시성(Visible) 여부를 확인할 DOM 요소
     *
     * @param {HTMLElement} scopeRootDom
     *   검사 범위를 제한하는 기준 루트 DOM 요소  
     *   `targetDom`부터 해당 요소에 도달할 때까지 부모 체인을 검사함
     *
     * @returns {boolean}
     *   `true`  → 화면상 표시됨  
     *   `false` → 숨겨져 있거나 상위 체인 중 일부가 숨김 처리됨
     */
    function isVisible(targetDom, scopeRootDom) {

        let style = getComputedStyle(targetDom);
        if (style.display === "none" || style.visibility === "hidden") {
            return false;
        }

        let currentParent = targetDom.parentElement;

        // 부모 체인 검사
        while (currentParent && currentParent !== scopeRootDom) {
            style = getComputedStyle(currentParent);
            if (style.display === "none" || style.visibility === "hidden") {
                return false;
            }
            currentParent = currentParent.parentElement;
        }

        return true;
    }


    /********************************************************************
     * Shortcut UI 중, oAreaDom 기준으로 활성화 대상 추출
     ********************************************************************/
    function getVisibleShortcutUIs(aCandidates, oAreaDom) {

        const visible = [];

        for (let o of aCandidates) {

            // area 내 포함 여부 (초고속)
            if (!oAreaDom.contains(o.dom)) continue;

            // visible 검사
            if (!isVisible(o.dom, oAreaDom)) continue;

            visible.push(o);
        }

        return visible;
    }


    /********************************************************************
     * UI fire 처리
     ********************************************************************/
    function fireUIs(aVisibleList) {

        for (let o of aVisibleList) {

            if (!o?.shot?.evtnm) {
                continue;
            }

            let oParams = {
                hotkey: o.shot.key
            };

            o.ui.fireEvent(o.shot.evtnm, oParams);

        }
    }


    /********************************************************************
     * 단축키 이벤트 함수
     ********************************************************************/
    function onShortCutEvent(e) {

        if (typeof e.repeat === "boolean" && e.repeat) {
            return;
        }

        // 단축키 조합을 문자열로 받음.
        let sKey = buildKeyString(e);

        // 단축키 리스트 중, 단축키 조합에 맞는 것만 추출
        let aMatch = aShortcutList.filter(o => o.key === sKey);
        if (aMatch.length === 0) return;

        // 단축키 UI 찾는 기준 영역
        let oAreaDom = document.activeElement;

        // ─────────────────────────────────────
        // (1) shortcut 대상 DOM 수집
        // ─────────────────────────────────────
        let aCandidates = collectUiDomRefs(aMatch);
        if (!aCandidates.length) {
            return;
        }

        // ─────────────────────────────────────
        // (2) visible UI만 필터링
        // ─────────────────────────────────────
        let aVisibleList = getVisibleShortcutUIs(aCandidates, oAreaDom);
        if (!aVisibleList.length) {
            return;
        }

        e.preventDefault(); // ← 브라우저 기본 'find' 동작 차단
        e.stopPropagation(); // (옵션) 다른 핸들러로 이벤트 전파 차단
    
        console.log(oAreaDom);
        console.log("➡️ 단축키 실행 대상 ===>", aVisibleList);

        // ─────────────────────────────────────
        // (3) fire
        // ─────────────────────────────────────
        fireUIs(aVisibleList);

    }

    /********************************************************************
     * KEYDOWN HANDLER
     ********************************************************************/
    document.addEventListener("keydown", onShortCutEvent, true);

})();