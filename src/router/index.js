import { setupLayouts } from 'virtual:generated-layouts';
import generatedRoutes from 'virtual:generated-pages';
import { createRouter, createWebHistory } from 'vue-router';

const routes = setupLayouts(generatedRoutes);

const router = createRouter({
    history: createWebHistory('/'),
    routes
});

// 브라우저 라우터 변경 전 관리
router.beforeEach((to, from, next) => {
    if (to.path == '/') {
        next('/TNPage');
    }
});

export default router;
