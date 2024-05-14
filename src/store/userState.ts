import { defineStore } from 'pinia';
import { Ref, ref } from 'vue';

export const uesUserStateStore = defineStore('userState', () => {
    // 비동기 호출 유무 상태
    const asyncState: Ref<Boolean> = ref(null);

    const asyncStart = function (): void {
        asyncState.value = true;
    };

    const asyncEnd = function (): void {
        asyncState.value = false;
    };

    // 컴퍼넌트 렌더링 진행 유무
    const isCompRendering: Ref<Boolean> = ref(false);

    // 사용자작업중단 유무
    const isSuspendedState: Ref<Boolean> = ref(false);

    return { asyncStart, asyncEnd, asyncState };
});
