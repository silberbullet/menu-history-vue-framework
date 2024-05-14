<script setup>
import { useLayout } from "@/layout/composables/layout";
import { useMenuStore } from "@/store/menu";
import { FilterMatchMode, FilterService } from "primevue/api";
import { useToast } from "primevue/usetoast";
import { computed, defineAsyncComponent, onMounted, ref, watch } from "vue";

const toast = useToast();
// ----------------------------------------------------
// -- sidebar
// ----------------------------------------------------
const { layoutConfig, layoutState, isSidebarActive } = useLayout();
const outsideClickListener = ref(null);

const AppFooter = defineAsyncComponent(() => import("./AppFooter.vue"));
const AppMenuHsty = defineAsyncComponent(() => import("./AppMenuHsty.vue"));
const AppSidebar = defineAsyncComponent(() => import("./AppSidebar.vue"));
const AppTopbar = defineAsyncComponent(() => import("./AppTopbar.vue"));

watch(isSidebarActive, (newVal) => {
  if (newVal) {
    bindOutsideClickListener();
  } else {
    unbindOutsideClickListener();
  }
});

const containerClass = computed(() => {
  return {
    // 미사용 주석처리(2024/02/28)
    // 'layout-theme-light': layoutConfig.darkTheme.value === 'light',
    // 'layout-theme-dark': layoutConfig.darkTheme.value === 'dark',
    "layout-overlay": layoutConfig.menuMode.value === "overlay",
    "layout-static": layoutConfig.menuMode.value === "static",
    "layout-static-inactive":
      layoutState.staticMenuDesktopInactive.value &&
      layoutConfig.menuMode.value === "static",
    "layout-overlay-active": layoutState.overlayMenuActive.value,
    "layout-mobile-active": layoutState.staticMenuMobileActive.value,
    "p-input-filled": layoutConfig.inputStyle.value === "filled",
    "p-ripple-disabled": !layoutConfig.ripple.value,
  };
});
const bindOutsideClickListener = () => {
  if (!outsideClickListener.value) {
    outsideClickListener.value = (event) => {
      if (isOutsideClicked(event)) {
        layoutState.overlayMenuActive.value = false;
        layoutState.staticMenuMobileActive.value = false;
        layoutState.menuHoverActive.value = false;
      }
    };
    document.addEventListener("click", outsideClickListener.value);
  }
};
const unbindOutsideClickListener = () => {
  if (outsideClickListener.value) {
    document.removeEventListener("click", outsideClickListener);
    outsideClickListener.value = null;
  }
};
const isOutsideClicked = (event) => {
  const sidebarEl = document.querySelector(".layout-sidebar");
  const topbarEl = document.querySelector(".layout-menu-button");

  return !(
    sidebarEl.isSameNode(event.target) ||
    sidebarEl.contains(event.target) ||
    topbarEl.isSameNode(event.target) ||
    topbarEl.contains(event.target)
  );
};

// 사이드바 토글 버튼
const angleLeft = ref(true);
const menuType = ref("layout-sidebar-left-config pi pi-angle-left");
const onSideBarOverLay = () => {
  angleLeft.value = !angleLeft.value;

  if (angleLeft.value) {
    layoutConfig.menuMode.value = "static";
    menuType.value = "layout-sidebar-left-config pi pi-angle-left";
  } else {
    layoutConfig.menuMode.value = "overlay";
    menuType.value = "layout-sidebar-right-config toggle-open  pi pi-angle-right";
  }
};
</script>

<template>
  <div class="layout-wrapper" :class="containerClass">
    <header class="layout-header">
      <app-topbar />
    </header>

    <div class="layout-left">
      <div class="layout-sidebar">
        <Suspense>
          <AppSidebar />
          <template #fallback>
            <div
              style="
                display: flex;
                justify-content: center;
                align-items: center;
                height: 80vh;
              "
            >
              <i class="pi pi-spin pi-spinner" style="font-size: 3rem"></i>
            </div>
          </template>
        </Suspense>
      </div>
      <span @click="onSideBarOverLay" :class="menuType"> </span>
    </div>

    <div class="layout-right">
      <div class="layout-menu-history">
        <AppMenuHsty />
      </div>
      <div class="layout-section">
        <router-view />
        <ScrollTop />
      </div>
    </div>

    <footer class="layout-footer">
      <app-footer v-once />
    </footer>
    <div class="layout-mask"></div>
  </div>
</template>

<style lang="scss" scoped></style>
