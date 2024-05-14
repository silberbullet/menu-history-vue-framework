import { acceptHMRUpdate, defineStore } from 'pinia';
import { computed, ref, Ref } from 'vue';

/**
 *  메뉴 객체 정의
 *  param : {
 *      parentLabel : 부모 라벨
 *      label : 자식 라벨
 *      dir   : 자식 라벨 vue 파일 이름\
 *      route : 자식 파일 경로
 */
interface MenuItem {
    parentLabel?: string;
    label?: string;
    component: string;
    route?: object | null;
    items?: object | any;
}

/**
 *  메뉴상태관리 설정
 */
export const useMenuStore = defineStore('menu', () => {
    /**
     *  state : 메뉴 파일 목록
     *  getter : Route가 존재하는 메뉴 목록
     *  action : 메뉴 목록 추가
     */

    const tnMenuList: Ref<MenuItem[]> = ref([]);

    const tnRouteMeunList = computed(() => {
        const List = new Array();
        tnMenuList.value.map((menu) => {
            // level 2
            if (menu.items) {
                menu.items.map((item: MenuItem) => {
                    if (item.route) {
                        List.push(item);
                    }
                });
            }
            // level 1
            else if (menu.route) {
                List.push(menu);
            }
        });

        return List;
    });

    const addTnMenuList = function (menu: MenuItem) {
        tnMenuList.value.push(menu);
    };

    /**
     *  최대 메뉴 갯수
     */
    const maxMnCnt = 10;
    /**
     *  state  : 메뉴 히스토리      (tnMnHstry)
     *           메뉴 캐시 목록     (tnMnCasheList)
     *           세션 메뉴 갯수     (tnMnSessionCnt)
     *           메뉴 오픈 가능 여부 (isFullMnCnt)
     *  getter : 최근 선택한 메뉴    (popTnMn)
     *           메뉴 경로          (tnMnRoute)
     *  action : 메뉴 목록 추가     (addTnMnHstry)
     *           세션 히스토리 세팅 (setSessionTnMnHstry)
     *           세션 메뉴 초기화   (resetTnMnHsty)
     */
    const tnMnHstry: Ref<MenuItem[]> = ref([]);

    const tnMnCasheList: Ref<string[]> = ref([]);

    const tnMnSessionCnt: Ref<number> = ref(JSON.parse(sessionStorage.getItem('menu'))?.length);

    const isFullMnCnt: Ref<boolean> = ref(false);

    const popTnMn = computed(() => tnMnHstry.value[tnMnHstry.value.length - 1]?.route);

    const tnMnRoute = computed(() => ({
        parentLabel: tnMnHstry.value[tnMnHstry.value.length - 1]?.parentLabel,
        label: tnMnHstry.value[tnMnHstry.value.length - 1]?.label
    }));

    const addTnMnHstry = function (menu: MenuItem) {
        // 현재 세션 메뉴 갯수가 maxMnCnt 일 때
        if (tnMnSessionCnt.value == maxMnCnt) {
            // 신규 추가할 메뉴가 메뉴 세션에 존재 하는지 확인
            const isMenuExists = JSON.parse(sessionStorage.getItem('menu')).find((menuSession: string) => {
                return menuSession === JSON.stringify(menu);
            });

            if (!isMenuExists) {
                // 존재하지 않을 시 메뉴 추가 금지 및 isFullMnCnt true 변경
                isFullMnCnt.value = true;
            } else {
                isFullMnCnt.value = false;
                addSessionTnMnHstry(menu);
            }
        } else {
            isFullMnCnt.value = false;
            addSessionTnMnHstry(menu);
        }
    };

    const addSessionTnMnHstry = function (menu: MenuItem) {
        tnMnHstry.value.push(menu);
        setSessionTnMnHstry();
    };

    const setSessionTnMnHstry = function () {
        const set = new Set<String>();

        if (!sessionStorage.getItem('menu')) {
            for (let i = 0; i < tnMnHstry.value.length; i++) {
                if (tnMnHstry.value[i]?.label) {
                    // 홈 화면 제외
                    if (tnMnHstry.value[i]?.label == 'Home') continue;
                    set.add(JSON.stringify(tnMnHstry.value[i].component));
                }
            }
            sessionStorage.setItem('menu', JSON.stringify(Array.from(set)));
        } else {
            const menuArr = JSON.parse(sessionStorage.getItem('menu'));

            for (let i = 0; i < menuArr.length; i++) {
                set.add(menuArr[i]);
            }
            for (let i = 0; i < tnMnHstry.value.length; i++) {
                if (tnMnHstry.value[i]?.label) {
                    // 홈 화면 제외
                    if (tnMnHstry.value[i]?.label == 'Home') continue;
                    set.add(JSON.stringify(tnMnHstry.value[i].component));
                }
            }
            sessionStorage.setItem('menu', JSON.stringify(Array.from(set)));
        }

        let menuSession = JSON.parse(sessionStorage.getItem('menu'));
        // 세션 메뉴 갯수 초기화
        tnMnSessionCnt.value = menuSession.length;

        // 캐시 목록 초기화 후 입력
        tnMnCasheList.value = [];
        for (let i = 0; i < menuSession.length; i++) {
            tnMnCasheList.value[i] = JSON.parse(menuSession[i]);
        }
    };

    const resetTnMnHsty = function (value: string) {
        sessionStorage.removeItem('menu');
        sessionStorage.setItem('menu', JSON.stringify(value));

        // 세션 메뉴 갯수 초기화
        tnMnSessionCnt.value = JSON.parse(sessionStorage.getItem('menu')).length;
    };

    function $reset() {
        tnMnHstry.value = new Array();
    }

    return { tnMnHstry, addTnMnHstry, popTnMn, tnMenuList, addTnMenuList, tnMnRoute, resetTnMnHsty, $reset, tnMnCasheList, tnMnSessionCnt, isFullMnCnt, tnRouteMeunList };
});

if (import.meta.hot) {
    import.meta.hot.accept(acceptHMRUpdate(useMenuStore, import.meta.hot));
}
