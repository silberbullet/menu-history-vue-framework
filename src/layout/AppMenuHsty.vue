<script setup>
import { useMenuStore } from "@/store/menu";
import _ from "lodash";
import ButtonGroup from "primevue/buttongroup";
import "swiper/css";
import "swiper/css/pagination";
import { Swiper, SwiperSlide } from "swiper/vue";
import { onMounted, ref } from "vue";

const tnMenu = useMenuStore();
const sessionHsty = ref([]);
const sessionLoad = ref(false);

// 마우스 좌표
const mx = ref();
const my = ref();
const showContextMenu = ref();
const contextMenu = ref([
  {
    label: "전체 닫기",
    icon: "pi pi-times",
    command: () => {
      sessionHsty.value = [];
      tnMenu.$reset();
      tnMenu.resetTnMnHsty([]);
    },
  },
]);

// 메뉴 이동
const moveMenu = function (menu) {
  tnMenu.addTnMnHstry(menu);
};

// 메뉴 히스토리 닫기
const closeMenu = function (index) {
  // 세션히스토리 차감

  sessionHsty.value.splice(index, 1);

  // 차감 후 최근 메뉴
  const lastMenu = sessionHsty.value[sessionHsty.value.length - 1] ?? {
    dir: "Dashboard",
    label: "Home",
  };

  // tnMnHstry 초기화
  tnMenu.$patch((state) => {
    if (sessionHsty.value && sessionHsty.value.length > 0) {
      state.tnMnHstry = _.cloneDeep(sessionHsty.value);
    } else if (sessionHsty.value.length == 0) {
      tnMenu.$reset();
    }
  });

  // 메뉴 세션 정보 초기화 처리
  const session = [];
  for (let i = 0; i < sessionHsty.value.length; i++) {
    session[i] = JSON.stringify(sessionHsty.value[i].component);
  }

  tnMenu.resetTnMnHsty(session);

  tnMenu.addTnMnHstry(lastMenu);
};

// tnMenu 변경될 때마다 SessionStorage 갱신
tnMenu.$subscribe((mutation) => {
  if (mutation.storeId == "menu" && mutation.type == "direct") {
    if (sessionStorage.getItem("menu")) {
      const session = JSON.parse(sessionStorage.getItem("menu"));
      for (let i = 0; i < session.length; i++) {
        tnMenu.tnRouteMeunList.map((menu) => {
          if (menu.component == JSON.parse(session[i])) {
            sessionHsty.value[i] = menu;
          }
        });
      }
      if (sessionHsty.value && session) {
        sessionLoad.value = true;
      }
    }
  }
});

const mouseLeft = function (event) {
  if (showContextMenu.value.visible) {
    showContextMenu.value.toggle(event);
  }
};

const mouseRight = function (event) {
  mx.value = event.pageX;
  my.value = event.pageY;

  showContextMenu.value.toggle(event);
};

onMounted(() => {
  // 메뉴 세션 데이터 확인
  if (sessionStorage.getItem("menu")) {
    sessionLoad.value = false;
  } else {
    sessionLoad.value = true;
  }
});
</script>

<template>
  <TieredMenu
    ref="showContextMenu"
    :model="contextMenu"
    :style="{
      minWidth: 'fit-content',
      top: `${my}px`,
      left: `${mx}px`,
    }"
    popup
  />
  <Menubar
    class="menubar-layout"
    @mousedown.left="mouseLeft"
    @mousedown.right="mouseRight"
    @mousewhel.passive="mouseLeft"
    @contextmenu.prevent
  >
    <template #start>
      <i v-if="!sessionLoad" class="pi pi-spin pi-spinner" style="font-size: 2rem"></i>
      <div>
        <Swiper
          :slidesPerView="6"
          :spaceBetween="0"
          :pagination="{
            clickable: true,
          }"
          class="mySwiper"
        >
          <SwiperSlide
            v-for="(menu, index) in sessionHsty"
            :key="index"
            class="menu-slide"
          >
            <ButtonGroup>
              <Button
                :label="menu.label"
                :severity="
                  tnMenu.tnMnRoute.label == menu.label ? 'contrast' : 'secondary'
                "
                :style="{ height: '40px' }"
                @click="moveMenu(menu)"
              />
              <Button
                icon="pi pi-times"
                :severity="
                  tnMenu.tnMnRoute.label == menu.label ? 'contrast' : 'secondary'
                "
                :style="{ height: '40px' }"
                @click="closeMenu(index)"
              />
            </ButtonGroup>
          </SwiperSlide>
        </Swiper>
      </div>
    </template>
    <template #end> </template>
  </Menubar>
</template>

<style lang="scss" scoped>
.menubar-layout {
  // height: 3.8rem;
  box-shadow: inset 0px 1px 4px rgba(0, 0, 0, 0.08), 0px 5px 5px rgba(0, 0, 0, 0.03);
}

.menu-slide {
  width: fit-content !important;
  margin-right: "3px" !important;
}
</style>
