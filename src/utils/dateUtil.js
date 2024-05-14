import axios from 'axios';

// 공공데이터포털 공휴일 조회 API, 인증키
const getHolidayUrl = import.meta.env.VITE_HOLIDAYS_API_URL;
const getHolidayAuthKey = import.meta.env.VITE_HOLIDAYS_AUTH_KEY;

export default {
    /**
     * 유효한 날짜 인지 체크
     *
     * @param {string} date 날짜 문자열, ex) "2023-05-05" or "20230505"
     * @returns {boolean} 유효한 날짜 일 시 true, 아닐 시 false
     */
    isValidDate: (date) => {
        let yyyymmdd;
        if (date.includes('-')) {
            yyyymmdd = date.replaceAll('-', '');
        } else {
            yyyymmdd = date;
        }

        // 문자 길이 유효성 체크
        if (yyyymmdd.length != 8) return false;

        // 월 유효성 체크
        const mm = yyyymmdd.substring(5, 6);
        if (mm < 0 && mm > 12) return false;

        // 일 유효성 체크
        const dd = yyyymmdd.substring(7, 8);
        if (dd < 0 && dd > 31) return false;

        return true;
    },

    /**
     * yyyy-MM-dd 혹은 yyyymmdd 날짜 문자열을 Date형으로 반환
     *
     * @param {string} date 날짜 문자열, ex) "2023-05-05" or "20230505"
     * @returns {Date} 입력한 날짜 객체 반환
     */
    strToDate: (date) => {},

    /**
     * Date형을 yyyyMMdd형의 문자열로 변환
     *
     * @param {Date} date 날짜 문자열, ex) "2023-05-05" or "20230505"
     * @returns {string} 입력한 날짜 객체 반환
     */
    dateToStr: (date) => {},

    /**
     * 두 일자 사이의 일 수 계산
     *
     * @param {Date} date1 날짜 문자열, ex) "2023-05-05" or "20230505"
     * @param {Date} date2 날짜 문자열, ex) "2023-05-05" or "20230505"
     * @returns {string} 입력한 날짜 객체 반환
     */
    getDiffDay: (date1, date2) => {},

    /**
     * 해당 날짜 요일 조회
     *
     * @param {string} date 날짜 문자열, ex) "2023-05-05"
     * @returns {string>} 해당 날짜의 요일
     */
    getDayOfWeek: (date) => {
        const week = ['일', '월', '화', '수', '목', '금', '토'];

        const dayOfWeek = week[new Date(date).getDay()];

        return dayOfWeek;
    },

    /**
     * 공휴일 정보 조회
     * 월별로 구분(휴일), 요일, 휴일 여부 등의 정보를 제공하는 공휴일 정보조회 기능 (정부 출처)
     *
     * @param {string} year 조회할 연도
     * @param {string} month 조회할 달
     * @returns {Array<object>} 해당 연도와 달에 대한 공휴일 정보 배열
     */
    getHoliday: async (year, month = null) => {
        const params = {
            serviceKey: getHolidayAuthKey,
            solYear: year,
            numOfRows: '30'
        };

        if (month !== null) {
            params.month = month;
        }

        try {
            const response = await axios.get(getHolidayUrl, { params });
            return response.data?.response?.body?.items.item;
        } catch (error) {
            console.error('Error fetching holidays:', error);
            throw error;
        }
    }
};
