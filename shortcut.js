/**
  * @class ShortcutManager
  * @classdesc
  * SAPUI5 환경에서 전역 단축키를 제어하는 매니저 클래스.
  * 
  * - keydown 이벤트를 특정 DOM 요소(document, body, div 등)에 바인딩 가능
  * - UI5 컨트롤 ID 기반 단축키 매핑
  * - display:none / visibility:hidden / 영역 내부 체크
  * - 최종 visible UI만 fireEvent
  */
export class ShortcutManager {

    /**
     * @constructor
     * @param {Array<Object>} [aShortcutList=[]]
     *   단축키 매핑 정보 배열  
     *   예: `{ key: "F8", ui: "BUTTON3", evtnm: "press" }`
     *
     * @param {HTMLElement | Document} [oKeyTarget=document]
     *   keydown 이벤트를 바인딩할 대상 DOM 요소  
     *   - document  
     *   - document.body  
     *   - div 등 HTMLElement 모두 가능
     */
    constructor(aShortcutList = [], oKeyTarget = document) {

        // 단축키 대상 목록 저장
        this._aShortcutList = aShortcutList;

        /** @private 이벤트 타겟 */
        this._oKeyTarget = oKeyTarget instanceof HTMLElement || oKeyTarget === document
            ? oKeyTarget
            : document;

        /**
          * @private
          * 이벤트 핸들러 콜백들을 초기화 (bind(this)).
          * 내부 인스턴스 변수에 저장.          
          */
        this._initEventHandlers();

        /** @private destroy 여부 플래그 */
        this._destroyed = false;

        // 키보드 이벤트 시작 여부 플래그
        this._started = false;

    }


    /**
     * @private
     * @method _initEventHandlers
     * @description
     * 내부 이벤트 핸들러(예: `_onKeyDown`)를 `this`로 bind하여  
     * 인스턴스 변수에 저장하는 초기화 함수.
     * DOM 이벤트 등록 전, 콜백 준비 단계 역할만 수행한다.
     */
    _initEventHandlers() {

        /** @private 바인딩된 이벤트 핸들러 */
        this._onKeyDown = this._onKeyDown.bind(this);

    }

    /* =====================================================================
     * PUBLIC API
     * ===================================================================== */

    /**
     * @method setShortcutList
     * @description
     * Shortcut 매핑 리스트를 교체한다.
     *
     * @param {Array<Object>} aList
     *   새로운 단축키 매핑 목록
     */
    setShortcutList(aList = []) {
        this._aShortcutList = Array.isArray(aList) ? aList : [];
    }

    getShortcutList(){
        return this._aShortcutList || [];
    }

    /**
     * @method start
     * @description
     * keydown 이벤트 리스너 활성화
     */
    start() {

        if(this._started) return;

        if (this._destroyed) return;        

        this._addEvents();

        this._started = true;
    }

    /**
     * @method stop
     * @description
     * keydown 이벤트 리스너를 비활성화한다.
     *
     * - destroy()와 달리 인스턴스는 보존됨
     * - start() 를 다시 호출하면 이벤트가 재등록됨
     */
    stop() {

        // 이미 중단된 상태면 무시
        if (!this._started) return;

        // 파괴된 인스턴스면 중단 불가
        if (this._destroyed) return;

        this._removeEvents();

        this._started = false;
    }
    
    /**
     * @method destroy
     * @description
     * ShortcutManager 인스턴스를 완전히 파괴한다.
     *
     * 내부 처리:
     * - keydown 이벤트 핸들러 제거
     * - 내부 변수 모두 null/빈값 초기화
     * - destroy 플래그 적용
     */
    destroy() {

        if (this._destroyed) return;

        // 이벤트 리스너 제거
        this._removeEvents();

        // 내부 변수 초기화
        this._aShortcutList = [];
        this._oKeyTarget = null;
        this._onKeyDown = null;
        this._destroyed = true;

    }
    
    isDestroyed(){
        return this._destroyed;
    }

    /* =====================================================================
     * PRIVATE UTIL METHODS
     * ===================================================================== */

    /**
     * @private
     * @method _addEvents
     * @description
     * ShortcutManager 에서 keydown 이벤트를 감지하기 위해  
     * `_oKeyTarget` 대상에 keydown 이벤트를 등록한다.
     *
     * start() 호출 시에만 실행되며,
     * stop() 또는 destroy() 호출 시 제거된다.
     */
    _addEvents(){

        if (!this._oKeyTarget) {
            return;
        }

        this._oKeyTarget.addEventListener("keydown", this._onKeyDown, true);

    }

    /**
     * @private
     * @method _removeEvents
     * @description
     * `_addEvents()` 로 등록된 keydown 이벤트 리스너를 제거한다.
     *
     * stop() 또는 destroy() 호출 시 실행된다.
     */
    _removeEvents() {

        if (!this._oKeyTarget) {
            return;
        }

        this._oKeyTarget.removeEventListener("keydown", this._onKeyDown, true);

    }

    /**
     * @static
     * @method _getUiId
     * @description
     * UI5 컨트롤 인스턴스에서 ID를 안전하게 추출한다.
     *
     * - getId() 가 존재하지 않으면 빈 문자열 반환  
     * - 정상적인 UI5 인스턴스일 경우 ID 문자열 반환  
     *
     * @param {sap.ui.core.Control} oUI
     *   UI5 컨트롤 인스턴스
     *
     * @returns {string}
     *   UI5 ID 문자열
     */
    static _getUiId(oUI) {
        if (!oUI) return "";
        if (typeof oUI.getId !== "function") return "";
        return oUI.getId() || "";
    }

    /**
     * @private
     * @method _buildKeyString
     * @description
     * keydown 이벤트 객체에서 단축키 문자열을 생성한다.
     *
     * - Ctrl / Shift / Alt 조합 포함  
     * - 문자 키는 대문자로 변환  
     * - 예: "Ctrl+S", "Shift+Alt+X", "F8"  
     *
     * @param {KeyboardEvent} event
     *   keydown 이벤트 객체
     *
     * @returns {string}
     *   단축키 문자열
     */
    _buildKeyString(event) {
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
     * @private
     * @method _collectUiDomRefs
     * @description
     * 단축키 매핑 목록(aMatch)에서  
     * UI5 컨트롤 인스턴스와 DOM 요소(DomRef)를 함께 수집한다.
     *
     * - ui: UI5 ID 문자열  
     * - sap.ui.getCore().byId() 로 컨트롤 조회  
     * - getDomRef() 로 실제 DOM 요소 추출  
     * - UI 또는 DOM 이 없으면 해당 항목은 제외  
     *
     * @param {Array<Object>} aMatch
     *   단축키 매핑 정보 목록
     *
     * @returns {Array<Object>}
     *   `{ shot, ui, dom }` 구조의 유효한 매핑 리스트
     */
    _collectUiDomRefs(aMatch) {

        const result = [];

        for (const item of aMatch) {

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
     * @private
     * @method _isVisible
     * @description
     * 전달된 DOM 요소가 실제 화면에 표시되고 있는지 검사한다.
     *
     * 검사 항목:
     * - 본인 또는 상위 요소 중 display:none 이 있는 경우 → false
     * - 본인 또는 상위 요소 중 visibility:hidden 이 있는 경우 → false
     *
     * @param {HTMLElement} targetDom  
     *   가시성을 점검할 실제 DOM 요소
     *
     * @param {HTMLElement} scopeRootDom  
     *   검사 종료 기준점 DOM  
     *   이 DOM에 도달하면 더 상위는 검사하지 않음
     *
     * @returns {boolean}  
     *   true = 화면에 표시됨, false = 숨김 처리됨
     */
    _isVisible(targetDom, scopeRootDom) {
        let style = getComputedStyle(targetDom);
        if (style.display === "none" || style.visibility === "hidden") {
            return false;
        }

        let currentParent = targetDom.parentElement;

        while (currentParent && currentParent !== scopeRootDom) {
            style = getComputedStyle(currentParent);
            if (style.display === "none" || style.visibility === "hidden") {
                return false;
            }
            currentParent = currentParent.parentElement;
        }

        return true;
    }

    /**
     * @private
     * @method _getVisibleShortcutUIs
     * @description
     * 단축키 후보 UI 목록 중에서  
     * 1) 현재 영역(oAreaDom)의 하위에 존재하고  
     * 2) display:none / visibility:hidden 이 아닌  
     * 실제 화면에 노출된(UI5 기준 visible) UI만 필터링한다.
     *
     * @param {Array<Object>} aCandidates  
     *   `_collectUiDomRefs()` 로 수집된 후보 UI 목록  
     *   구조: `{ shot, ui, dom }`
     *
     * @param {HTMLElement} oAreaDom  
     *   단축키 탐색 기준 DOM (document.activeElement)
     *
     * @returns {Array<Object>}  
     *   화면에 보이는 UI들만 담긴 배열
     */
    _getVisibleShortcutUIs(aCandidates, oAreaDom) {

        const visible = [];

        for (let o of aCandidates) {

            if (!oAreaDom.contains(o.dom)) continue;

            if (!this._isVisible(o.dom, oAreaDom)) continue;

            visible.push(o);
        }

        return visible;
    }

    /**
     * @private
     * @method _fireUIs
     * @description
     * 단축키에 매칭되었고, 실제 화면에 보이는 UI들만  
     * 지정된 UI5 이벤트(evtnm)를 fireEvent 로 호출한다.
     *
     * 이벤트 파라미터:
     * - hotkey: 실제 눌린 단축키 문자열(Ctrl+S 등)
     *
     * @param {Array<Object>} aVisibleList  
     *   `_getVisibleShortcutUIs()` 결과  
     *   구조: `{ shot, ui, dom }`
     */
    _fireUIs(aVisibleList) {

        for (let o of aVisibleList) {

            if (!o?.shot?.evtnm) continue;

            o.ui.fireEvent(o.shot.evtnm, {
                hotkey: o.shot.key
            });
        }
    }

    /**
     * @private
     * @method _getAreaDom
     * @description
     * 단축키 판별 시 기준이 되는 **영역 DOM**을 반환한다.
     *
     * 현재 방식:
     * - document.activeElement 를 기준으로 사용
     *
     * 이유:
     * - activeElement 기준으로 그 하위 DOM만 단축키 탐색 대상으로 삼음
     * - 페이지 전환, Dialog, Popover 등 focus 기반 UI5 구조에 적합
     *
     * @returns {HTMLElement}
     *   현재 focus 되어 있는 DOM 요소
     */
    _getAreaDom() {
        return document.activeElement;
    }

    /**
     * @private
     * @method _onKeyDown
     * keydown 이벤트 → 단축키 매칭 → UI fireEvent
     */
    _onKeyDown(e) {

        // 파괴된 인스턴스면 즉시 종료
        if (this._destroyed) return;

        // 반복 입력(e.repeat) 차단
        if (typeof e.repeat === "boolean" && e.repeat) {
            console.log("키보드 꾹 누르기 금지!!");
            return;
        }

        // 눌린 키를 단축키 문자열로 변환 (Ctrl+S 등)
        const sKey = this._buildKeyString(e);

        // 매핑된 단축키 찾기
        const aMatch = this._aShortcutList.filter(o => o.key === sKey);
        if (aMatch.length === 0) return;

        // 단축키에 해당하는 UI를 탐색하는 기준이 되는 영역 DOM을 구한다.
        const oAreaDom = this._getAreaDom();

        // UI 인스턴스 + DOM 수집
        const aCandidates = this._collectUiDomRefs(aMatch);
        if (!aCandidates.length) return;

        // 실제 화면에 보이는 UI만 필터링
        const aVisibleList = this._getVisibleShortcutUIs(aCandidates, oAreaDom);
        if (!aVisibleList.length) return;

        console.log("단축키 대상 ---> ", aVisibleList);

        // 단축키에 해당하는 내용을 찾을 경우는 다른 keydown 이벤트 전파 방지
        e.preventDefault();
        e.stopPropagation();

        // 해당 UI 이벤트 실행
        this._fireUIs(aVisibleList);
    }

} // end of ShortcutManager class

