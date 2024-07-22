<script setup>
import { useMenuStore } from '@/store/menu';
import { onMounted, ref } from 'vue';
import AppMenuItem from './AppMenuItem.vue';

const tnmain = ref(null);
const tnguide = ref(null);
const menuRouteList = ref(null);

const tnMenu = useMenuStore();
const model = ref([
    {
        label: '샘플 UI',
        icon: 'pi pi-fw pi-desktop',
        root: true,
        items: [
            {
                label: '[컴포넌트] FormLayout',
                icon: 'pi pi-fw pi-check-square',
                component: 'FormLayout'
            },
            {
                label: '[컴포넌트] Button',
                icon: 'pi pi-fw pi-check-square',
                component: 'ButtonSample'
            },
            {
                label: '[컴포넌트] Input',
                icon: 'pi pi-fw pi-check-square',
                component: 'InputSample'
            }
        ]
    },
    {
        label: '개발자 테스트 페이지 ',
        icon: 'pi pi-user-edit',
        root: true,
        component: 'DevPage'
    }
]);

// 컴포넌트 경로 맵
async function loadComponentRoutes() {
    const components = await Promise.all(
        Object.entries(menuRouteList.value).map(async ([path, componentLoader]) => {
            const moduleName = path.split('/').pop().replace('.vue', '');
            const component = await componentLoader();
            return { moduleName, component: component.default || component };
        })
    );
    const componentMap = Object.fromEntries(components.map((c) => [c.moduleName, c.component]));

    return componentMap;
}

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
