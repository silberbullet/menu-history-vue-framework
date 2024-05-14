import { useMenuStore } from '@/store/menu';
import { uesUserStateStore } from '@/store/userState';
import axios from 'axios';
import { getCurrentInstance } from 'vue';

export default {
    /**
     * @param {
     *  url : path (예시 : "/api/test")
     *  data : RequestBody 데이터
     *  success : 요청 성공 콜백함수, 응답값 response.data
     *  error : 요청 실패 콜백함수, 에러내용 error
     * }
     */
    request: async ({ url, data, success, error }) => {
        // 사용자 상태 관리
        const useState = uesUserStateStore();
        // 인증서 허용 설정
        axios.defaults.withCredentials = true;
        // 헤더 설정
        const headers = {
            Accept: '*/*',
            'Content-type': 'application/json'
        };

        // url 설정
        let fullUrl = import.meta.env.VITE_MC_SERVER_URL + url;

        const config = {
            headers,
            method: 'POST',
            url: fullUrl,
            data: JSON.stringify(data)
        };

        useState.asyncStart();
        await axios(config)
            .then(function (response) {
                useState.asyncEnd();
                success(response.data);
            })
            .catch(function (reason) {
                useState.asyncEnd();
                error(reason);
            });
    },

    /**
     * @param {
     *  object : 타 화면으로 보내는 프로퍼티
     *  (예시 : {  slitmCd : 2032243 , slitmNm : 상품명 })
     * }
     */
    sendProperty: (object) => {
        window.property = object;
    },

    /**
     * sendProperty에 값을 받아야하는 Vue에 OnMounted시 호출
     *
     * 보낸 프로퍼티의 키 값이 대상 Vue에 반응형 변수로 선언이 되어있을 시 자동 세팅
     * @param {
     *  (예시 : const slitmCd = ref(null) -> const slitmCd = ref(2032243))
     * }
     * @returns sendProperty
     */
    getProperty: () => {
        if (window.property) {
            const instance = getCurrentInstance();

            if (instance.setupState) {
                Object.keys(instance.setupState).forEach((key) => {
                    if (Object.keys(window.property).includes(key)) {
                        instance.setupState[key] = window.property[key];
                    }
                });

                delete window.property;
            }
        }
    },

    /**
     * 화면 이동 함수 (+ 전달할 프로퍼티도 추가 가능)
     *
     * @param {*} link 이동할 vue 파일명 (.vue 확장자명은 제외)
     * @param {*} property 화면 이동 시 전달할 프로퍼티 값
     */
    changeView: function (link, property = null) {
        const tnMenu = useMenuStore();

        for (let i = 0; i < tnMenu.tnRouteMeunList.length; i++) {
            if (tnMenu.tnRouteMeunList[i].component == link) {
                if (property != null) {
                    this.sendProperty(property);
                }
                tnMenu.addTnMnHstry(tnMenu.tnRouteMeunList[i]);
            }
        }
    }
};
