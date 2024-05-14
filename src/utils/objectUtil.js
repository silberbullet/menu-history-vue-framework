import _ from 'lodash';

export default {
    /**
     * 객체의 깊은 복사를 수행
     * @param {Object} object 깊은 복사를 수행할 객체
     * @returns {Object} 깊은 복사된 새 객체
     */
    deepClone: (object) => {
        return _.cloneDeep(object);
    },

    /**
     * 두 객체를 병합합니다. 두 번째 객체의 속성이 첫 번째 객체의 속성을 덮어씁니다.
     * @param {Object} object1 첫 번째 객체.
     * @param {Object} object2 두 번째 객체.
     * @returns {Object} 병합된 새 객체.
     */
    mergeObjects: (object1, object2) => {
        return _.merge({}, object1, object2);
    },

    /**
     * 객체에서 지정한 키의 값들을 추출하여 배열로 반환합니다.
     * @param {Object} object 객체.
     * @param {string} key 추출할 값의 키.
     * @returns {Array} 키에 해당하는 값들의 배열.
     */
    valuesForKey: (object, key) => {
        return _.map(object, key);
    },

    /**
     * 객체의 모든 키를 소문자로 변경합니다.
     * @param {Object} object 객체.
     * @returns {Object} 키가 모두 소문자로 변경된 객체.
     */
    keysToLowercase: (object) => {
        return _.transform(
            object,
            (result, value, key) => {
                result[key.toLowerCase()] = value;
            },
            {}
        );
    },

    /**
     * 객체에서 조건에 맞는 요소만 필터링합니다.
     * @param {Object} object 객체.
     * @param {Function} predicate 각 요소에 적용될 조건 함수.
     * @returns {Object} 조건에 맞는 요소만을 포함하는 객체.
     */
    filterByValue: (object, predicate) => {
        return _.pickBy(object, predicate);
    },

    /**
     * 값이 null, undefined, 또는 비어 있는지 체크합니다.
     * @param {*} value 체크할 값.
     * @returns {boolean} 값이 null, undefined, 또는 비어있다면 true, 그렇지 않다면 false.
     */
    isNull: (value) => {
        return _.isNull(value) || _.isUndefined(value) || (_.isEmpty(value) && !_.isNumber(value) && !_.isBoolean(value));
    }
};
