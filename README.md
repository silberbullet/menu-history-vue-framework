# 세션 스토리지와 캐싱을 이용한 BO 화면 프레임워크

#### 배경

> 사내 CRM 프로젝트에서 기존 서버 사이드 JSP 프로젝트를 Cilent가 Vue로 전환하면서 컴포넌트 호출을 라우터 기능 없이 한 페이지에서 호출 되도록 기획 하였다. </br>
> 라우터를 사용하지 않고 메뉴 히스토리 기능과 초기화 버튼 구현을 요구사항으로 받게 되었다. </br> > **Vue 에서 제공해주는 KeepAlive 기능은 세션 스토리지에 따라 캐싱을 지우는 기능이 없어 커스텀이 필요했다.** </br>
> Pinia 라이브러리와 KeepAlive을 커스텀 하여 메뉴 히스토리를 구현하게 됐다.

## 목차

1. [분석](#-분석)
2. [설계](#-설계)
3. [구현](#-구현)
4. [테스트](#-테스트)

## ▶ 분석

1. **import.meat.glob && subcribe**
   vite는 import.meta.glob 함수를 이용해 여러 모듈을 한 번에 가져올 수 있도록 지원하고 있다. 이는 동적 Import 형식으로 가져오게 된다. 또한 **가져온 모듈들을 순회하여 각 모듈에 접근이 가능하다.**</br>

    Pinia 라이브러리는 상태관리를 세션 스토리지에 저장 혹은 저장소를 쓰일 수가 있다. 또한 Pinia가 제공해주는 **$subscribe(구독) 기능을 통해서 특정 상태가 변경 시에 다른 컴포넌트가 이를 이벤트 처리가 가능하다.**

2. **Vue KeepAlive 빌트인 컴포넌트**

    ```vue
    <KeepAlive>
        <component :is="activeComponent" />
    </KeepAlive>
    ```

    Vue에서 제공하는 <KeepAlive>는 내부의 모든 컴포넌트 인스턴스를 캐시한다. 캐싱 정보는 {컴포넌트 이름 : 컴포넌트 파일} 이렇게 Key, Value 쌍으로 Set 자료구조에 쌓는 구조이다.

    하지만 **기본 Vue에서 제공하는 KeepAlive의 Props 중에서는 캐싱 정보를 직접 삭제하거나 제어하는 속성은 제공되지 않는다**

## ▶ 설계

1. **메뉴 호출 프로세스**

    ```mermaid
    sequenceDiagram
    participant User
    participant MenuComponent
    participant PiniaStore
    participant SessionStorage
    participant TnPage
    participant VueComponent
    participant CustomKeepAlive

    MenuComponent->>MenuComponent:onMount시 Vue 파일 import.glob
    MenuComponent ->> PiniaStore : {vue 파일 이름, Proxy}으로 저장
    User->>MenuComponent: 메뉴 선택
    MenuComponent->>PiniaStore: 최근 선택한 메뉴 업데이트
    PiniaStore->>SessionStorage: 최근 선택한 메뉴 이름 저장
    PiniaStore-->>TnPage: 최근 선택한 컴포넌트 Proxy 객체 전달 (subscribe)
    TnPage->>VueComponent: <component>에 동적 임포트
    VueComponent->>CustomKeepAlive: 캐싱 처리
    VueComponent->> User: 선택한 메뉴 출력
    ```

    MenuComponent는 onMount 시 import.glob.meta를 활용하여 프로젝트 특정 경로에 vue 파일들을 가져온 후 Pinia에 List 형태로 넣는다. **이 때 Vue 파일명과 Component명은 동일하다는 전제가 있다.**</br>
    사용자가 메뉴 선택 시, 메뉴와 매핑되는 Component 명을 Key값으로 Proxy 객체를 PiniaStorage에 상태관리를 하고 최근 선택된 컴포넌트를 TnPage에서 전달 받는다. 그 후 <component/>에 Dynamic Import 후 캐싱 처리를 한다.</br>
    선택된 컴포넌트 명은 세션 스토리지에 순차적으로 저장이 된다.**(메뉴 히스토리 정보로 사용하기 위함)**

2. **메뉴 히스토리 프로세스**

    ```mermaid
    sequenceDiagram
    participant User
    participant PiniaStore
    participant MenuHistoryComponent
    participant SessionStorage
    participant TnPage
    participant VueComponent
    participant CustomKeepAlive


    PiniaStore->>MenuHistoryComponent: 최근 선택한 메뉴 업데이트(subscribe)
    SessionStorage->>MenuHistoryComponent : 선택한 메뉴 목록 전달
    User->>MenuHistoryComponent: 메뉴 히스토리에 메뉴 선택
    PiniaStore-->>TnPage: 최근 선택한 컴포넌트 Proxy 객체 전달 (subscribe)
    TnPage->>VueComponent: <component>에 동적 임포트
    VueComponent->>CustomKeepAlive: 캐싱 처리
    VueComponent->> User: 선택한 메뉴 출력
    User->>MenuHistoryComponent : 메뉴 히스토리 삭제
    MenuHistoryComponent->>SessionStorage : 세션 삭제
    MenuHistoryComponent->>PiniaStore :캐시 리스트 삭제
    PiniaStore->>CustomKeepAlive :삭제된 메뉴 캐시 제거
    ```

    MenuHistoryComponent은 subscribe를 통해 메뉴가 선택 될 때마다 세션 스토리지와 최근 선택된 메뉴와 함께 리스트를 받는다.</br>
    메뉴 히스토리에서 메뉴 선택 시, 메뉴 호출 프로세스와 똑같이 프로세스 처리가 되고 캐시 처리가 된다.</br>
    메뉴 히스토리에서 닫기 버튼을 클릭 시, CustomKeepAlive에서도 캐시를 제거한다.

## ▶ 구현

1. **Pinia 메뉴 상태 관리 구현**

2. **메뉴 선택 시 세션 스토리지에 저장**

    AppMenu(MenuComponent)는 onMount시 import.meta.glob를 통해 Pinia에 저장한다.

    ```javascript
    onMounted(async () => {
        // .vue 파일 가져오기
        tnmain.value = import.meta.glob('@/views/**/*.vue');
        tnguide.value = import.meta.glob('@/components/*.vue');

        menuRouteList.value = Object.assign(tnguide.value, tnmain.value);

        // 메뉴 경로 및 컴포넌트 로드
        const componentMap = await loadComponentRoutes();

        model.value.forEach((menuList) => {
            // 홈 화면을 제외한 메뉴 상태 관리 등록
            if (menuList.label !== 'Home') {
                if (menuList.items) {
                    menuList.items.forEach((menu) => {
                        if (menu.component) {
                            // 부모 라벨 정보 추가
                            menu.parentLabel = menuList.label;
                            // 경로 추가
                            if (componentMap[menu.component]) {
                                menu.route = componentMap[menu.component];
                            }
                        }
                    });
                } else if (menuList.component) {
                    if (componentMap[menuList.component]) {
                        menuList.route = componentMap[menuList.component];
                    }
                }
                tnMenu.addTnMenuList(menuList);
            }
        });
    });
    ```

    AppMenuItem(AppMenu 자식 컴포넌트)는 클릭 시 최근 메뉴 정보를 Pinia에 전달한다.

    ```javascript
      // 선택한 메뉴 상태 관리
    if (item.component != undefined) {
    componentDir.value = item.component;
    componentPlabel.value = item.parentLabel;
    componentLabel.value = item.label;

    if (item.route != undefined) {
      componentRoute.value = item.route;
    } else {
      showNoFileError();
      return;
    }

    tnMenu.addTnMnHstry({
      parentLabel: componentPlabel.value,
      label: componentLabel.value,
      component: componentDir.value,
      route: item.route,
    });
    ```

3. **메뉴히스토리 구현**

4. **KeepAlive 커스텀**

    Vue 3.0에서 개발된 KeepAlive 소스를 참조하여 defineComponent를 통해 커스텀한 TnKeepAlive 빌트인 컴포넌트

    아래 주요 기능을 작성하였다.

    ```typescript
    // 메뉴 세션
    const tnMenu = useMenuStore();

    // 캐시 삭제
    function pruneCache(filter?: (name: string) => boolean) {
        cache.forEach((vnode, key) => {
            const name = getComponentName(vnode.type as ConcreteComponent);
            if (name && (!filter || !filter(name))) {
                pruneCacheEntry(key);
            }
        });
    }

    // 캐시 삭제
    function pruneCacheEntry(key: CacheKey) {
        const cached = cache.get(key) as VNode;
        if (!current || !isSameVNodeType(cached, current)) {
            unmount(cached);
        } else if (current) {
            resetShapeFlag(current);
        }
        cache.delete(key);
        keys.delete(key);
    }

    let pendingCacheKey: CacheKey | null = null;

    /**
     * 세션 기준으로 삭제 대상 캐시 선정 후 삭제
     *
     * @param {menuSession} menuSession 현재 세션스토리지 'menu'에 값
     */
    function pruneSessionCache(menuSession: String[]) {
        cache.forEach((vnode, key) => {
            const name = getComponentName(vnode.type as ConcreteComponent);
            if (!menuSession.includes(name as string) && name != 'Dashboard') {
                cache.delete(key);
                keys.delete(key);
            }
            if (menuSession.length == 0 && name != 'Dashboard') {
                unmount(vnode);

                cache.delete(key);
                keys.delete(key);
            }
        });
    }

    // 캐시 세팅
    function cacheSubtree() {
        if (pendingCacheKey != null) {
            // 신규 들어온 캐시의 컴퍼넌트가 기존에 있는 캐시 일 시 (key만 다를 경우 기존 캐시 캐시 삭제)
            if (typeof pendingCacheKey == 'number') {
                const newComp = getComponentName(instance.subTree.type as ConcreteComponent);
                cache.forEach((vnode, key) => {
                    const oldComp = getComponentName(vnode.type as ConcreteComponent);
                    if (oldComp == newComp) {
                        cache.delete(key);
                        keys.delete(key);
                    }
                });
            }
            cache.set(pendingCacheKey, getInnerChild(instance.subTree));
        }
    }

    watch(
        () => [props.include, props.exclude, tnMenu.tnMnCasheList],
        ([include, exclude]) => {
            include && pruneCache((name) => matches(include as MatchPattern, name));
            exclude && pruneCache((name) => !matches(exclude as MatchPattern, name));

            pruneSessionCache(tnMenu.tnMnCasheList);
        },

        { flush: 'post', deep: true }
    );

    // 생명함수 정의
    onMounted(cacheSubtree);
    onUpdated(() => {
        cacheSubtree();
        addAnimationToCurrent(current);
    });
    ```

## ▶ 테스트

1. **세션 스토리지 저장 확인**
   ![Session FrameWork - Chrome 2024-07-22 18-53-29](https://github.com/user-attachments/assets/dbcef3d8-f30b-40ab-95a9-676469b230c0)

2. **커스텀 KeepAlive 캐싱처리 확인**
