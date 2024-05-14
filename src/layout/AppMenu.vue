<script setup>
import { useAuthStore } from "@/store/auth";
import { useMenuStore } from "@/store/menu";
import { onMounted, ref } from "vue";
import AppMenuItem from "./AppMenuItem.vue";

const tnmain = ref(null);
const tnguide = ref(null);
const menuRouteList = ref(null);

const tnMenu = useMenuStore();
const authStore = useAuthStore();
const model = ref([
  {
    label: "Home",
    root: true,
    icon: "pi pi-fw pi-home",
    component: "Dashboard",
  },
  {
    label: "개발자 UI 가이드 ",
    icon: "pi pi-fw pi-desktop",
    root: true,
    items: [
            {
              label: "[컴포넌트] Basic",
              icon: "pi pi-fw pi-check-square",
              component: "SampleCompBasic"
            },
            {
              label: "[컴포넌트] Button",
              icon: "pi pi-fw pi-check-square",
              component: "SampleCompButton"
            },
            {
              label: "[컴포넌트] Calendar",
              icon: "pi pi-fw pi-check-square",
              component: "SampleCompCalendar"
            },
            {
              label: "[컴포넌트] Dropdown",
              icon: "pi pi-fw pi-check-square",
              component: "SampleCompDropdown"
            },
            {
              label: "[컴포넌트] Grid",
              icon: "pi pi-fw pi-check-square",
              component: "SampleCompGrid"
            },
            {
              label: "[컴포넌트] Table",
              icon: "pi pi-fw pi-check-square",
              component: "SampleCompTable"
            },
            {
              label: "[컴포넌트] Tab",
              icon: "pi pi-fw pi-check-square",
              component: "SampleCompTab"
            },
            {
              label: "[컴포넌트] Modal",
              icon: "pi pi-fw pi-check-square",
              component: "SampleCompModal"
            }
        ]
  },
  {
    label: "개발자 테스트 페이지 ",
    icon: "pi pi-user-edit",
    root: true,
    component: "DevPage",
  },
]);

// 컴포넌트 경로 맵
async function loadComponentRoutes() {
  const components = await Promise.all(
    Object.entries(menuRouteList.value).map(async ([path, componentLoader]) => {
      const moduleName = path.split("/").pop().replace(".vue", "");
      const component = await componentLoader();
      return { moduleName, component: component.default || component };
    })
  );
  const componentMap = Object.fromEntries(
    components.map((c) => [c.moduleName, c.component])
  );

  return componentMap;
}

onMounted(async () => {
  const ssMenuList = authStore.authMenuList;
  let idx = model.value.length - 1;
  ssMenuList.map((dat) => {
    //1 레벨 : 고객
    if (!dat.frmNm) {
      // MC 메뉴 제외
      if (dat.mnLv != 1) {
        model.value[++idx] = {
          label: dat.mnNm, //ex. 고객
          //icon: "pi pi-user-edit",
          root: true,
          component: dat.frmUrl, //null
          items: [],
        };
      }
      // 2 레벨: 고객목록, 담당고객목록
    } else {
      model.value[idx].items.push({
        label: dat.mnNm, //ex. 고객목록
        //icon: "pi pi-fw pi-check-square",
        component: dat.frmUrl, ///tms/cs/customer/initCstList.do
        //현재 DB에 저장된 경로와 vue의 main 경로가 달라서 DB 컬럼 추가 또는 데이터 수정이 필요함
      });
    }
  });

  // ( T.CRM 메인 컴퍼넌트 , UX, UI 가이드 컴퍼넌트 ) .vue 파일 가져오기
  tnmain.value = import.meta.glob("@/views/**/*.vue");
  tnguide.value = import.meta.glob("@/components/guide/*.vue");

  menuRouteList.value = Object.assign(tnguide.value, tnmain.value);

  // 메뉴 경로 및 컴포넌트 로드
  const componentMap = await loadComponentRoutes();

  model.value.forEach((menuList) => {
    // 홈 화면을 제외한 메뉴 상태 관리 등록
    if (menuList.label !== "Home") {
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
</script>

<template>
  <ul class="layout-menu">
    <template v-for="(item, i) in model" :key="item">
      <app-menu-item v-if="!item.separator" :item="item" :index="i"></app-menu-item>
      <!-- <li v-if="item.separator" class="menu-separator">이건 뭘까?</li> -->
    </template>
  </ul>
</template>

<style lang="scss" scoped></style>
