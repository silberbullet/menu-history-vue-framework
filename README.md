<!-- prettier-ignore-start -->
# TogAI.CRM
## 커밋 메시지 구조

### 커밋메시지 타입

| 타입  이름 | 내용 |
| ------- | ------- |
| feat | 새로운 기능에 대한 커밋 |  
| fix | 버그 수정에 대한 커밋 |
| build | 빌드 관련 파일 수정 / 모듈 설치 또는 삭제에 대한 커밋 |
| chore | 그외 자잘한 수정에 대한 커밋 |
| docs | 문서 수정에 대한 커밋 |
| style | 코드 스타일 혹은 포맷 등에 관한 커밋 |
| refactor | 코드 리팩토링에 대한 커밋 |
| test | 테스트 코드 수정에 대한 커밋 |
| perf | 성능 개선에 대한 커밋 |

---

### 커밋메시지 규칙(💡)

```
# 커밋 메시지 이슈넘버 제외가능
$ <type>: <subject>
  <BLANK LINE>
  <body>
  <BLANK LINE>
  <footer>

# 예시
feat : 상품 일괄등록 시 엑셀업로드 기능 개선 필요

엑셀업로드 기능 개선

resolves : #1
```


---

## 브랜치 생성 및 명명규칙(💡)
```
# 생성규칙
 - develop branch 기준


# 명명규칙
 - feature/영문이름/생성일자
 - 예시 : feature/gildonghong/20240226

```

---

## 메인 폴더 구조
```
.root
└─src
    ├─assets                    // static 파일 관리
    │  ├─demo
    │  ├─layout
    ├─components                // 컴퍼넌트
    │  ├─common                 // 공통 컴퍼넌트 (전역화 대상)
    │  │  ├─tnbutton
    │  │  ├─tncalendar
    │  │  ├─tncheckbox
    │  │  ├─tndropdown
    │  │  ├─tngrid
    │  │  ├─tninput
    │  │  ├─tnlabel
    │  │  ├─tnradiobutton
    │  │  ├─tntable
    │  │  └─tntextarea
    │  └─guide                  // UX,UI 가이드
    ├─dictionary
    ├─layout                    // App 레이아웃 설정
    ├─router                    // 라우터 (path 관리)
    ├─store                     // 전역 상태 관리 (세션 관리)
    ├─utils                     // 공통함수 관리
    └─views
        └─pages
            ├─common            // 공통 페이지 관리
            └─main              // TogAI.CRM 업무 폴더
               ├─af
               ├─cg
               ├─cm
               ├─cs
               ├─cti
               ├─of
               ├─py
               └─template
```

#### Copyright 2024 TENNOD SOLUTION CO.,Ltd. All Rights Reserved.
<!-- prettier-ignore-end -->
