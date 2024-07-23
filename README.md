# 세션 스토리지와 캐싱을 이용한 BO 화면 프레임워크

#### 배경

> 사내 CRM 프로젝트에서 기존 서버 사이드 JSP 프로젝트를 Cilent가 Vue로 전환하면서 컴포넌트 호출을 라우터 기능 없이 한 페이지에서 호출 되도록 기획 하였다. </br>
> 라우터를 사용하지 않고 메뉴 히스토리 기능과 초기화 버튼 구현을 요구사항으로 받게 되었다. </br> > **Vue 에서 제공해주는 KeepAlive 기능은 세션 스토리지에 따라 캐싱을 지우는 기능이 없어 커스텀이 필요했다.** </br>
> Pinia 라이브러리와 KeepAlive을 커스텀 하여 메뉴 히스토리를 구현하게 됐다.

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

## ▶ 구현

0. **메뉴 호출 방식**

1. **메뉴 선택 시 세션 스토리지에 저장**

2. **KeepAlive 커스텀**

## ▶ 테스트
