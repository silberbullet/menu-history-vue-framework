<script setup>
//import '@/assets/layout/frame.scss';
import { useMenuStore } from "@/store/menu";
import Dashboard from "@/views/Dashboard.vue";
import {
  computed,
  defineAsyncComponent,
  onMounted,
  onUpdated,
  ref,
  shallowRef,
  warn,
} from "vue";

// 메뉴 경로
const breadcrumbHome = ref({ icon: "pi pi-home", component: "Dashboard" });
const breadcrumbItems = computed(() => {
  if (tnMenu.tnMnRoute.label && tnMenu.tnMnRoute.parentLabel) {
    return [{ label: tnMenu.tnMnRoute.parentLabel }, { label: tnMenu.tnMnRoute.label }];
  } else if (
    tnMenu.tnMnRoute.label &&
    tnMenu.tnMnRoute.label != "Home" &&
    !tnMenu.tnMnRoute.parentLabel
  ) {
    return [{ label: tnMenu.tnMnRoute.label }];
  } else {
    return [];
  }
});

// 메뉴 상태 관리 (Store)
const tnMenu = useMenuStore();
let popTnMn;

const isHome = ref(true);

// TnKeepAlive 접근 객체 {key,comp}
const TnKeepAlive = defineAsyncComponent(() => import("../../../utils/TnKeepAlive.ts"));
const keepAliveList = shallowRef([]);
const compKey = ref(0);
const currentKey = ref(0);
const AsyncComponent = shallowRef(null);

/**
 * tnMenu의 상태 변경을 구독
 *
 * 메인 화면 : 선택한 메뉴에 따라 componentList에 vue 파일 이름과 동일한 모듈 동적으로 AsyncComponent에 할당
 *            할당 전 KeepAlive 캐시 처리에 따라서 임의로 키 값을 세팅해서 렌더링 ( keepAliveList에 컴퍼넌트와 키 값 저장 )
 *
 * @param {mutation} mutation tnMenu의 변경된 State 값
 */
tnMenu.$subscribe((mutation) => {
  // 메뉴 경로 설정
  if (tnMenu.popTnMn != "Dashboard" && tnMenu.popTnMn) {
    isHome.value = false;
  } else {
    isHome.value = true;
  }

  // 메뉴 히스토리가 없을 시 Home으로 이동
  if (tnMenu.tnMnHstry.length == 0) {
    AsyncComponent.value = Dashboard;
    currentKey.value = 0;

    return;
  }

  // 메인 화면
  if (mutation.storeId == "menu") {
    if (mutation.type == "direct" || tnMenu.popTnMn) {
      // 얕은 복사 수행 시, Proxy 해제 (반응형 해제)
      popTnMn = { ...tnMenu.popTnMn }; // 얕은 복사를 수행

      try {
        let keyValue = 0;
        const index = keepAliveList.value.findIndex(
          (item) => item.comp.__name === popTnMn.__name
        );

        if (index == -1) {
          keepAliveList.value.push({
            key: ++compKey.value,
            comp: popTnMn,
          });
          keyValue = compKey.value;
          AsyncComponent.value = popTnMn;
        } else {
          // 화면 이동 시, 전달할 프로퍼티가 존재하면 초기화 필요 ( key * 1000 적용 )
          if (window.property) {
            keepAliveList.value[index].key *= 1000;
          }
          keyValue = keepAliveList.value[index].key;
          AsyncComponent.value = keepAliveList.value[index].comp;
        }

        if (keyValue == 0) {
          throw new Error("key 값 세팅 오류");
        }
        currentKey.value = keyValue;
      } catch (error) {
        warn("컴퍼넌트 로딩 실패" + error);
      }
    }
  }
});

// 컴퍼넌트 리로드
const reload = function () {
  const index = keepAliveList.value.findIndex(
    (item) => item.comp.__name === popTnMn.__name
  );
  keepAliveList.value[index].key *= 1000;
  currentKey.value *= 1000;
};

onMounted(() => {
  AsyncComponent.value = Dashboard;
});

onUpdated(() => {
  // 화면 이동 후 2초 뒤에 window.property 제거
  setTimeout(() => {
    if (window.property) {
      // getPropety 부재로 인한 window.property 영속성 제거
      delete window.property;
    }
  }, 2000);
});
</script>

<template>
  <Breadcrumb
    v-show="!isHome"
    :home="breadcrumbHome"
    :model="breadcrumbItems"
    class="app-search-breadcrump"
  />
  <div class="Tntitle" v-show="!isHome" style="display: flex">
    {{ tnMenu.tnMnRoute.label }}

    <Button
      icon="pi pi-refresh"
      text
      raised
      rounded
      aria-label="초기화"
      style="width: 2.5rem; height: 2.5rem; margin-left: auto"
      @click="reload"
    />
  </div>

  <Suspense>
    <!-- 캐싱 화면 10개로 제한 -->
    <TnKeepAlive max="10">
      <component :key="currentKey" :is="AsyncComponent" />
    </TnKeepAlive>
  </Suspense>
</template>

<style lang="scss">
$min-width: 768px;

.app-search-breadcrump {
  background: none;
  border: none;
}

// TnKeepAlive 자식 컴퍼넌트 css 적용 (TnKeepAlive.ts (229) 참조)
.fade-in {
  animation: fadeInAnimation 0.35s ease-in;
}

@keyframes fadeInAnimation {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.Tntitle {
  font-weight: bold;
  font-size: 2rem;
  padding: 1rem;
}
@media (min-width: 768px) {
  .Tntitle {
    font-size: 1.25rem;
  }
}
</style>
