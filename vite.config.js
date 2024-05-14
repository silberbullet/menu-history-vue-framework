import legacy from '@vitejs/plugin-legacy';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';
import { PrimeVueResolver } from 'unplugin-vue-components/resolvers';
import Components from 'unplugin-vue-components/vite';
import { defineConfig } from 'vite';
import pages from 'vite-plugin-pages';
import layouts from 'vite-plugin-vue-layouts';

export default defineConfig(() => {
    return {
        envDir: 'src/dictionary',
        optimizeDeps: {
            exclude: ['primevue', 'xlsx']
        },
        // 초기 root 지정 옵션
        base: '/',
        build: {
            // 빌드 되는 브라우저 js코드 환경 설정 ( 구식 브라우저에서도 호환 시 => esnext 변경)
            target: 'esnext',
            // chrome, edge, firefox, safari 브라우저 지원 설정
            rollupOptions: {},
            // 빌드 종료 시 빌드 작업 종료
            watch: false, // true 시 빌드 상태 유지 : gitlab-ci 다음 스크립트 실행 불가
            outDir: 'dist',
            plugins: [
                // 레거시 브라우저 지원

                legacy({
                    targets: ['defaults', 'not IE 11']
                })
            ],
            cssCodeSplit: true
        },
        plugins: [
            vue({
                script: {
                    defineModel: true,
                    propsDestructure: true,
                    template: {
                        compilerOptions: {
                            // treat all tags with a dash as custom elements
                            isCustomElement: (tag) => {
                                tag.includes('tn') || tag.includes('Tn');
                            }
                        }
                    }
                }
            }),
            // 레이아웃 설정
            layouts({
                layoutsDirs: 'src/layout',
                pagesDir: 'src/views/pages/common',
                defaultLayout: 'AppLayout'
            }),
            // 페이지 설정
            pages({
                pagesDir: 'src/views/pages/common'
            }),

            // 전역 컴퍼넌트 설정
            Components({
                dts: true,
                dirs: ['src/components/common'],
                // 프라임 뷰 컴퍼넌트 전역 설정
                resolvers: [PrimeVueResolver()]
            })
        ],
        resolve: {
            alias: {
                '@': fileURLToPath(new URL('./src', import.meta.url))
            }
        }
    };
});
