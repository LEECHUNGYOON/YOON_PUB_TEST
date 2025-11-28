(async function(){
    "use strict";

    const fs = require('fs');
    const path = require('path');

    const u4aRecRep = require("../u4a-record-replay");

    const u4arec = new u4aRecRep.record({ type: "u4a" });
    const u4arep = new u4aRecRep.replay({ type: "u4a" });

    function waiting(itime) {
        return new Promise(resolve => {
            setTimeout(resolve, itime);
        });
    }

    // 레코드 시작
    async function record(){

        console.log("record !!");


        /**
         * V1
         */
        // let sUrl = "https://u000.u4aide.com:10101/zu4a/ylcy_test2100?sap-language=EN&sap-client=800";

        // await u4arec.launchPage(sUrl);

        // await u4arec.startRecording();


        // await waiting(1000 * 30);

        // let oRecordData = await u4arec.stopRecording();
        
        // saveScript(oRecordData);

        // await waiting(1000 * 10);

        // debugger;

        // // 레코딩 종료
        // await u4arec.close();



        /**
         * V2
         */
        // let url = "https://u000.u4aide.com:10101/zu4a/ylcy_test2100?sap-language=EN&sap-client=800";

        // const recorder = new u4aRecRep.record({ type: 'u4a' });

        // await recorder.launchPage(url);

        // const result = await recorder.startRecording();
        // if (result.status === 'stopped') {
        //     // 시나리오 1: 정상 종료 (중지 버튼 클릭)
        //     saveScript(result.data);

        // } else if (result.status === 'disconnected') {
        //     // 시나리오 2: 브라우저 강제 종료
        //     console.log('사용자가 브라우저를 닫았습니다.');
        //     // 저장 여부 확인 후 처리
        //     if (confirm('저장하시겠습니까?')) {
        //         saveScript(result.data);
        //     }
        // }




        const recorder = new u4aRecRep.record({ type: 'u4a' });        

        let url = "https://u000.u4aide.com:10101/zu4a/ylcy_test2100?sap-language=EN&sap-client=800";

        await recorder.launchPage(url);

        let aRecData = [];

        recorder.onRec(function(data){



        });

        const result = await recorder.startRecording();

        if (result.status === 'stopped') {
            // 시나리오 1: 정상 종료 (중지 버튼 클릭)
            saveScript(result.data);

        } else if (result.status === 'disconnected') {
            // 시나리오 2: 브라우저 강제 종료
            console.log('사용자가 브라우저를 닫았습니다.');
            // 저장 여부 확인 후 처리
            if (confirm('저장하시겠습니까?')) {
                saveScript(result.data);
            }
        }


        let oRecordData = await u4arec.stopRecording();

        // 레코딩 종료
        await u4arec.close();

        

    } // end of record





    async function replay(){

        console.log("replay !!", __dirname);

        let sRepRoot = path.join(__dirname, "..", "recordData");

        let aDirList = fs.readdirSync(sRepRoot);

        // await u4arep.launchPage();
        for(const sFileName of aDirList){

            let sJsonFilePath = path.join(sRepRoot, sFileName);

            let sJsonData = fs.readFileSync(sJsonFilePath, "utf-8");

            let oJsonData = JSON.parse(sJsonData);

            let sUrl  = oJsonData.url;
            let sType = oJsonData.type;

            let u4arep = new u4aRecRep.replay({ type: sType });

            await u4arep.launchPage(sUrl);

            await u4arep.play(oJsonData);

            await u4arep.close();

        }

    } // end of replay


    async function replayOnce(){

        let sRepRoot = path.join(__dirname, "..", "recordData");

        let sFileName = "recorded_script_20251128_190558.json";

        let sJsonFilePath = path.join(sRepRoot, sFileName);

        let sJsonData = fs.readFileSync(sJsonFilePath, "utf-8");

        let oJsonData = JSON.parse(sJsonData);

        let sUrl  = oJsonData.url;
        let sType = oJsonData.type;

        let u4arep = new u4aRecRep.replay({ type: sType });

        await u4arep.launchPage(sUrl);

        let oResult = await u4arep.play(oJsonData);

        debugger;

        await u4arep.close();

    }




    // 날짜 포맷팅 헬퍼 함수 (YYYYMMDD_HHmmss)
    function getFormattedTimestamp() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0'); // 월은 0부터 시작하므로 +1
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');

        return `${year}${month}${day}_${hours}${minutes}${seconds}`;
    } // end of getFormattedTimestamp


    // 2. 수정된 저장 함수
    function saveScript(actions) {        

        // 타임스탬프 생성
        const timestamp = getFormattedTimestamp();
        
        // 파일명 생성: recorded_script_20231127_134500.json
        const fileName = `recorded_script_${timestamp}.json`;
        
        // (선택사항) 저장 경로 설정 - 예: 현재 실행 경로의 'recordings' 폴더
        // const savePath = path.join(__dirname, 'recordings', fileName); 
        // *폴더가 미리 존재해야 에러가 안 납니다. 지금은 간단히 현재 경로에 저장합니다.
        // const savePath = path.join("..", fileName); 
        const savePath = "./recordData/" + fileName;

        try {
            fs.writeFileSync(savePath, JSON.stringify(actions, null, 2));
            console.log(`[Success] Script saved to: ${savePath}`);
            return savePath; // 저장된 경로 반환
        } catch (err) {
            console.error('[Error] Failed to save script:', err);
        }
    }


    // await record();



    // await replay();

    await replayOnce();
    
})();