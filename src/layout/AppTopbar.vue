<script setup>
import { useAuthStore } from "@/store/auth";
import { useMenuStore } from "@/store/menu";
import TnModal from "@/utils/modalUtil.js";
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useRouter } from "vue-router";

import { FilterMatchMode, FilterService } from "primevue/api";
import { useToast } from "primevue/usetoast";

const outsideClickListener = ref(null);
const topbarMenuActive = ref(false);
const router = useRouter();
const tnMenu = useMenuStore();
const authStore = useAuthStore();

const toast = useToast();

onMounted(() => {
  bindOutsideClickListener();
});

onBeforeUnmount(() => {
  unbindOutsideClickListener();
});

const onTopBarMenuButton = () => {
  topbarMenuActive.value = !topbarMenuActive.value;
};

const topbarMenuClasses = computed(() => {
  return {
    "layout-topbar-menu-mobile-active": topbarMenuActive.value,
  };
});

const bindOutsideClickListener = () => {
  if (!outsideClickListener.value) {
    outsideClickListener.value = (event) => {
      if (isOutsideClicked(event)) {
        topbarMenuActive.value = false;
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
  if (!topbarMenuActive.value) return;

  const sidebarEl = document.querySelector(".layout-topbar-menu");
  const topbarEl = document.querySelector(".layout-topbar-menu-button");

  return !(
    sidebarEl.isSameNode(event.target) ||
    sidebarEl.contains(event.target) ||
    topbarEl.contains(event.target)
  );
};

// 홈 화면 이동
const onGoHome = () => {
  tnMenu.addTnMnHstry({ dir: "Dashboard", label: "Home" });
};

// 로그아웃 이동
const goLogOut = async () => {
  await TnModal.confirm(
    "로그아웃을 진행하시겠습니까?",
    async () => {
      await authStore.logout();
      authStore.$reset();
    },
    () => {
      return null;
    }
  );
};

// ----------------------------------------------------
// -- searchbar
// ----------------------------------------------------
const selectedMenu = ref();
const filteredMenu = ref();
const allMenuList = ref(null);

const props = defineProps({
  // focus 시 검색 기능 활성화
  completeOnFocus: {
    type: Boolean,
    default: true,
  },
  emptySearchMessage: {
    // 검색 결과 미존재 시 츌력 메시지
    type: String,
    default: "검색 결과가 존재하지 않습니다.",
  },
});

// 메뉴 검색 결과 출력
const searchMenu = (event) => {
  setTimeout(() => {
    let query = event.query;
    let newFilteredMenu = new Array();

    // LIKE 조건 검색
    for (let menu of allMenuList.value) {
      let filtered = FilterService.filter(
        menu.items,
        ["label"],
        query,
        FilterMatchMode.CONTAINS
      );

      if (filtered && filtered.length) {
        newFilteredMenu.push({ ...menu, ...{ items: filtered } });
      }
    }

    filteredMenu.value = newFilteredMenu;

    inputToBold();
  }, 100);
};

// input값과 일치하는 문자 강조 처리
const inputToBold = () => {
  setTimeout(() => {
    let inputValue = selectedMenu.value;

    if (inputValue != null && inputValue.length > 0) {
      const filteredCollection = document?.getElementsByClassName("p-autocomplete-item");
      const filteredArray = Array.from(filteredCollection);

      filteredArray.forEach((item) => {
        let menuName = item.textContent;

        if (menuName.toLowerCase().includes(inputValue.toLowerCase())) {
          let idx = menuName.toLowerCase().indexOf(inputValue.toLowerCase());
          let subs = menuName.substring(idx, idx + inputValue.length);
          item.innerHTML = menuName.replace(
            subs,
            `<span style=color:red; >` + subs + `</span>`
          );
        }
      });
    }
  }, 100);
};

// 메뉴 선택 및 이동
const selectMenu = () => {
  if (!selectedMenu.value.route) {
    toast.add({
      severity: "error",
      summary: "존재하지 않는 Vue 파일",
      detail: "해당 메뉴에 Vue 파일이 존재하지 않습니다.",
      life: 2000,
    });
  } else {
    tnMenu.addTnMnHstry({
      parentLabel: selectedMenu.value.parentLabel,
      label: selectedMenu.value.label,
      component: selectedMenu.value.component,
      route: selectedMenu.value.route,
    });
  }
  // 2. 검색창 초기화
  selectedMenu.value = null;
};

onMounted(() => {
  allMenuList.value = tnMenu.tnMenuList;

  // 레이아웃 요소들 비동기 처리
});
</script>

<template>
  <div class="layout-topbar">
    <span class="p-link layout-menu-button layout-topbar-button" @click="onGoHome()">
      TogAI.CRM
    </span>

    <div class="layout-topbar-menu" :class="topbarMenuClasses">
      <div class="menu-search-bar">
        <AutoComplete
          class="menu-search-input"
          v-model="selectedMenu"
          :suggestions="filteredMenu"
          @item-select="selectMenu"
          @complete="searchMenu"
          optionLabel="label"
          optionGroupLabel="label"
          optionGroupChildren="items"
          :completeOnFocus="props.completeOnFocus"
          :emptySearchMessage="props.emptySearchMessage"
          placeholder="메뉴 검색"
        >
          <template #optiongroup="slotProps">
            <div class="align-items-center country-item">
              <div>{{ slotProps.item.label }}</div>
            </div>
          </template>
        </AutoComplete>
      </div>
      <span class="p-link layout-topbar-logo">
        <span>ID : {{ authStore.reqUsrId }}</span>
      </span>
      <span class="p-link layout-topbar-logo">
        <span> {{ authStore.afmNm }}</span>
      </span>
      <!-- <span class="p-link layout-topbar-logo"> {{ authStore.opCtrNo }}</span> -->
      <!-- <span class="p-link layout-topbar-logo"> {{ authStore.lsLgDtm }}</span> -->
      <button
        v-tooltip.bottom="{ value: '마이페이지', showDelay: 200, hideDelay: 200 }"
        @click="onTopBarMenuButton()"
        class="p-link layout-topbar-button"
      >
        <i class="pi pi-user"></i>
        <span>마이페이지</span>
      </button>
      <button
        v-tooltip.bottom="{ value: '로그아웃', showDelay: 200, hideDelay: 200 }"
        @click="goLogOut()"
        class="p-link layout-topbar-button"
      >
        <i class="pi pi-sign-out"></i>
        <span>로그아웃</span>
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .p-autocomplete-panel {
    position: fixed !important;
  }
</style>
