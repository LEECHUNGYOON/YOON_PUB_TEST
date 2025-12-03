(function(){

    class ServerManager {

        constructor(options){
            // options.context 구조 예상: { "loU4A": { ...객체... } }
            this.context = options.context || {};
        }

        getMethod (sName){
            return this[sName];
        }

        sendParam(){

            let script = `loU4A.xxx();`;

            eval(script);
        }

        send(){

            // 스크립트는 서버에서 받아오거나 동적으로 생성된다고 가정
            // 여기서는 loU4A라는 변수명을 사용하고 있음
            let script = `loU4A.xxx();`;
            // let script = `zzz();`;


            // eval(script);

            // return;
            
            // [수정 포인트 1] 하드코딩 제거 및 범용 처리
            // this.context가 { loU4A: {...} } 형태이므로
            // Keys는 ['loU4A']가 되고, Values는 [실제객체]가 됩니다.
            var argNames = Object.keys(this.context);   
            var argValues = Object.values(this.context); 

            try {
                // 생성되는 함수: function(loU4A) { loU4A.xxx(); }
                // argNames가 ['loU4A', 'otherVar'...] 처럼 여러 개여도 자동으로 처리됨
                var dynamicFunc = new Function(...argNames, script);
                
                // 함수 실행: dynamicFunc(실제객체)
                dynamicFunc(...argValues);

            } catch (e) {
                console.error("스크립트 실행 중 오류:", e);
            }
        }
    }



    function zzz (){

        console.log("zzz");
    }

    function lf_test(){
      
        
        // 1. 실제 사용할 로컬 객체 및 함수 정의
        let loU4A = {}; // 변수명이 loU4A일 필요 없음 (내부적으론 myLocalObject)
        
        loU4A.xxx = function(){
            console.log("xxx 실행 성공!");
        };
        
        loU4A.bbb = function(){
            console.log("bbb");
        };

        debugger;
        
        // [수정 포인트 2] ServerManager에게 "변수명"과 "객체"를 지정해서 전달
        // 뜻: "ServerManager야, 내가 준 객체(myLocalObject)를 스크립트 안에서는 'loU4A'라는 이름으로 쓸 거야."
        let oServerManager = new ServerManager({ 
            context: { 
                loU4A: loU4A 
            } 
        });

        oServerManager.send();

        // let lf_send = oServerManager.getMethod('sendParam');

        // function aaa (){
        //     lf_send();
        // }

        // aaa();
        

        
    }

    lf_test();

})();