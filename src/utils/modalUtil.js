export default {
    /**
     * alert 창을 띄운다.
     * @param {*} message 메시지
     * @returns alert
     */
    alert: (msg) => {
        const confirm = window.modal;

        confirm.require({
            message: msg,
            header: '알림',
            icon: 'pi pi-info-circle',
            acceptLabel: '확인',
            rejectClass: 'p-alert'
        });
    },
    /**
     * Confirm 창을 띄운다.
     * @param {*} message 메시지
     * @param {*} yes 확인 클릭시 콜백 메소드
     * @param {*} no  아니요 클릭시 콜백 메소드
     * @returns Confirm
     */
    confirm: async (msg, yes, no) => {
        const confirm = window.modal;

        await confirm.require({
            message: msg,
            header: '확인',
            icon: 'pi pi-info-circle',
            accept: () => {
                yes();
            },
            reject: () => {
                no();
            },
            acceptLabel: '확인',
            rejectLabel: '아니요'
        });
    }
};
