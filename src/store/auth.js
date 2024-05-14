//vue3쿠키이용
import router from '@/router/index';
import TNCommon from '@/utils/commonUtil.js';
import TnModal from '@/utils/modalUtil.js';
import crypto from 'crypto-js';
import { defineStore } from 'pinia';

export const useAuthStore = defineStore({
    id: 'auth',
    state: () => ({
        //헤더 정보: 사용자id, 사용자명, 제휴가맹점명, 최종로그인일시
        reqUsrId: '',
        usrNm: '',
        afmNm: '',
        lsLgDtm: '',
        //메뉴 및 권한취득
        authMenuList: [], //AppMenu에 이미 MenuList가 있어서 앞에 auth를 붙임
        authMap: [],
        returnUrl: null,
        opCtrNo: ''
    }),
    actions: {
        async login(userId, userPw, opCtrValue) {
            //로그인 파라미터
            const loginTelegram = {
                usrId: userId.value,
                pwd: encPwd(userPw.value),
                opCtrNo: opCtrValue.value.opCtrNo,
                // TODO 상수화 확인
                mbsC: 'K1',
                lanC: 'ko',
                sysC: 'TCMC',
                reqChC: '41'
            };

            // MC 서버 로그인
            await TNCommon.request({
                url: '/scf/login/login',
                data: loginTelegram,
                success: (data) => {
                    if (data.successYn == 'Y') {
                        //AuthStore에 저장
                        this.reqUsrId = data.respData.reqUsrId;
                        this.usrNm = data.respData.usrNm;
                        this.afmNm = data.respData.afmNm;
                        this.lsLgDtm = data.respData.lsLgDtm;
                        this.authMenuList = data.respData.menuList;
                        this.authMap = data.respData.authMap;
                        this.opCtrNo = data.respData.opCtrNo;

                        router.push('/TNPage');
                    } else {
                        alert(data.respMsg);
                    }
                },
                error: (error) => {
                    if (error.config.data) {
                        TnModal.alert(error.config.data.respMsg);
                    }
                    console.error(error);
                }
            });
        },
        async logout() {
            await TNCommon.request({
                url: '/scf/login/logout',
                data: null,
                success: (data) => {
                    if (data.successYn == 'Y') {
                        TnModal.alert(data.respMsg);
                        router.push('/TNLogin');
                    } else {
                        console.log(data.respMsg);
                    }
                },
                error: (error) => {
                    console.error(error);
                    if (error.config.data) {
                        TnModal.alert(error.config.data.respMsg);
                    }
                }
            });
        },
        async clearToken() {
            await TNCommon.request({
                url: '/scf/login/logout',
                data: null,
                success: (data) => {
                    if (data.successYn == 'Y') {
                        console.log('Token Clear!');
                    } else {
                        console.log(data.respMsg);
                    }
                },
                error: (error) => {
                    console.error(error);
                }
            });
        }
    },
    persist: {
        enabled: true
    }
});

const encPwd = (dat) => {
    const encryptDat = crypto.SHA256(dat).toString();
    return encryptDat;
};
