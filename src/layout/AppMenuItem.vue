<script setup>
import { useLayout } from "@/layout/composables/layout";
import { useMenuStore } from "@/store/menu";
import Toast from "primevue/toast";
import { useToast } from "primevue/usetoast";
import { onBeforeMount, ref, watch } from "vue";

const tnMenu = useMenuStore();
const toast = useToast();
const { layoutConfig, layoutState, setActiveMenuItem, onMenuToggle } = useLayout();

const props = defineProps({
  item: {
    type: Object,
    default: () => ({}),
  },
  index: {
    type: Number,
    default: 0,
  },
  root: {
    type: Boolean,
    default: true,
  },
  rootLabel: {
    type: String,
    default: "",
  },
  parentItemKey: {
    type: String,
    default: null,
  },
});

const isActiveMenu = ref(false);
const itemKey = ref(null);
const componentDir = ref(null);
const componentPlabel = ref(null);
const componentLabel = ref(null);
const componentRoute = ref(null);

watch(
  () => layoutConfig.activeMenuItem.value,
  (newVal) => {
    isActiveMenu.value =
      newVal === itemKey.value || newVal.startsWith(itemKey.value + "-");
  }
);

const toggleSubMenu = () => {
  isActiveMenu.value = !isActiveMenu.value;
};

const itemClick = (event, item) => {
  // 하위 목록 존재 시 토글 버튼 작동
  if (item.items) {
    toggleSubMenu();
  }

  if (item.disabled) {
    event.preventDefault();
    return;
  }

  const { overlayMenuActive, staticMenuMobileActive } = layoutState;

  if (staticMenuMobileActive.value || overlayMenuActive.value) {
    onMenuToggle();
  }

  if (item.command) {
    item.command({ originalEvent: event, item: item });
  }

  // 하위 메뉴만 인덱스 시정
  if (!item.root) {
    const foundItemKey = item.items
      ? isActiveMenu.value
        ? props.parentItemKey
        : itemKey
      : itemKey.value;
    setActiveMenuItem(foundItemKey);
  }

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

    if (tnMenu.isFullMnCnt) {
      showFullMnCntWarn();
    }
  }
};

// 존재하지 않는 Vue 파일 메시지 기능
const showNoFileError = () => {
  toast.add({
    severity: "error",
    summary: "존재하지 않는 Vue 파일",
    detail: "해당 메뉴에 Vue 파일이 존재하지 않습니다.",
    life: 2000,
  });
};

// 열기 가능한 화면 갯수 초과기능
const showFullMnCntWarn = () => {
  toast.add({
    severity: "warn",
    summary: "열기 가능한 화면 갯수 초과",
    detail: "메뉴 히스토리에 최대 10개에 \n 화면을 열 수 있습니다.",
    life: 3000,
  });
};

// 현재 선택된 메뉴 표시
const checkActiveRoute = (item) => {
  if (item.label == tnMenu.tnMnRoute.label) {
    return true;
  } else {
    return false;
  }
};

onBeforeMount(() => {
  itemKey.value = props.parentItemKey
    ? props.parentItemKey + "-" + props.index
    : String(props.index);

  const activeItem = layoutState.activeMenuItem;

  isActiveMenu.value =
    activeItem === itemKey.value || activeItem
      ? activeItem.startsWith(itemKey.value + "-")
      : false;
});
</script>

<template>
  <Toast />
  <li :class="{ 'active-menuitem': isActiveMenu }" class="layout-menuitem">
    <a
      @click="itemClick($event, item, index)"
      :class="{ 'layout-root-menuitem': root, 'active-route': checkActiveRoute(item) }"
    >
      <i :class="item.icon" class="layout-menuitem-icon"></i>
      {{ item.label }}
      <i class="pi pi-fw pi-angle-down layout-submenu-toggler" v-if="item.items"></i>
    </a>
    <Transition name="layout-submenu">
      <ul
        v-show="isActiveMenu && item.items && item.visible !== false"
        class="layout-submenu"
      >
        <app-menu-item
          v-for="(child, i) in item.items"
          :key="child"
          :index="i"
          :item="child"
          :parentItemKey="itemKey"
          :root="false"
        ></app-menu-item>
      </ul>
    </Transition>
  </li>
</template>

<style lang="scss" scoped>
.layout-root-menuitem > a {
  font-size: 0.857rem;
  text-transform: uppercase;
  font-weight: 700;
  color: var(--surface-900);
  margin: 0.75rem 0;
}

.layout-submenu {
  margin-left: 1rem; /* 하위 메뉴가 들여쓰기될 정도의 여백 설정 */
}
</style>
