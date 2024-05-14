import '@/assets/styles.scss';
import moment from 'moment';
import { createPinia } from 'pinia';
import piniaPersist from 'pinia-plugin-persist';
import BadgeDirective from 'primevue/badgedirective';
import PrimeVue from 'primevue/config';
import ConfirmationService from 'primevue/confirmationservice';
import ConfirmDialog from 'primevue/confirmdialog';
import DialogService from 'primevue/dialogservice';
import Ripple from 'primevue/ripple';
import StyleClass from 'primevue/styleclass';
import ToastService from 'primevue/toastservice';
import Tooltip from 'primevue/tooltip';
import { createApp, ref } from 'vue';
import App from './App.vue';
import router from './router';

const getReactivity = () => {
    let target = ref('abc');
    let update = (val) => (target.value = val);
    return { target, update };
};

const pinia = createPinia();
const app = createApp(App);

app.gl;
// 라우터 사용
app.use(router);
// 피니아 사용 (상태관리 )
app.use(pinia);
pinia.use(piniaPersist);
// 프라임 뷰 사용 -> TN 컴퍼넌트로 컨버전 필요
app.use(PrimeVue, { ripple: true });

app.use(ToastService);
app.use(DialogService);
app.use(ConfirmationService);

app.component('ConfirmDialog', ConfirmDialog);

app.directive('tooltip', Tooltip);
app.directive('badge', BadgeDirective);
app.directive('ripple', Ripple);
app.directive('styleclass', StyleClass);

// 전역 변수 제공
app.provide('pageModel', getReactivity());
app.provide('parentModel', getReactivity());
app.provide('moment', moment);

app.mount('#app');

// window 전역 변수 등록 (모달 팝업)
window.modal = app.config.globalProperties.$confirm;
