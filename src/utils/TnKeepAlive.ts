import { ShapeFlags, invokeArrayFns, isArray, isFunction, isRegExp, isString } from '@vue/shared';
import {
    ComponentInternalInstance,
    ComponentOptions,
    ConcreteComponent,
    VNode,
    callWithAsyncErrorHandling,
    cloneVNode,
    defineComponent,
    getCurrentInstance,
    handleError,
    onBeforeUnmount,
    onMounted,
    onUpdated,
    setTransitionHooks,
    warn,
    watch
} from 'vue';
import { useMenuStore } from '../store/menu';

// 환경 변수 정의
const __SSR__ = import.meta.env.SSR;
const __DEV__ = import.meta.env.DEV;
const __FEATURE_PROD_DEVTOOLS__ = import.meta.env.PROD;

// 타입 확장
declare module 'vue' {
    interface ComponentInternalInstance {
        ctx?: ComponentInternalInstance | null;
        renderer: any;
        da: any;
        suspense: VNode;
        activate: Function;
        deactivate: Function;
        a: any;
    }
    interface VNode {
        ssContent: any;
        nextSibling: any;
        slotScopeIds: any;
    }
}

// 타입 정의
enum MoveType {
    ENTER,
    LEAVE,
    REORDER
}

type MatchPattern = string | RegExp | (string | RegExp)[];
type CacheKey = string | number | symbol | ConcreteComponent;
type Cache = Map<CacheKey, VNode>;
type Keys = Set<CacheKey>;

// 메뉴 세션
const tnMenu = useMenuStore();

// 컴퍼넌트 정의
const TnKeepAlive = /*#__PURE__*/ defineComponent({
    name: 'TnKeepAlive',

    __isKeepAlive: true,

    props: {
        include: {
            type: [String, RegExp, Array]
        },
        exclude: {
            type: [String, RegExp, Array]
        },
        max: {
            type: [String, Number]
        }
    },

    setup(props, slots) {
        const cache: Cache = new Map();
        const keys: Keys = new Set();
        let current: VNode | null = null;

        // TnKeepAlive 인스턴스 접근
        const instance = getCurrentInstance();
        const sharedContext = instance.ctx as ComponentInternalInstance;

        // Vue KeepAlive와 동일 환경 설정
        if (__SSR__ && !sharedContext.renderer) {
            return () => {
                const children = slots.slots.default && slots.slots.default();
                return children && children.length === 1 ? children[0] : children;
            };
        }

        if (__DEV__ || __FEATURE_PROD_DEVTOOLS__) {
            (instance as any).__v_cache = cache;
        }

        const parentSuspense = instance.suspense;

        const {
            renderer: {
                p: patch,
                m: move,
                um: _unmount,
                o: { createElement }
            }
        } = sharedContext;

        // div 블록 생성
        const storageContainer = createElement('div');

        sharedContext.activate = (vnode: VNode, container, anchor, namespace, optimized) => {
            const instance = vnode.component!;
            // in case props have changed
            patch(instance.vnode, vnode, container, anchor, instance, parentSuspense, namespace, vnode.slotScopeIds, optimized);
            move(vnode, container, anchor, MoveType.ENTER, parentSuspense);
            queuePostRenderEffect(() => {
                instance.isDeactivated = false;
                if (instance.a) {
                    invokeArrayFns(instance.a);
                }
                const vnodeHook = vnode.props && vnode.props.onVnodeMounted;
                if (vnodeHook) {
                    invokeVNodeHook(vnodeHook, instance.parent, vnode);
                }
            }, parentSuspense);

            if (__DEV__ || __FEATURE_PROD_DEVTOOLS__) {
                // Update components tree
                devtoolsComponentAdded(instance);
            }
        };

        sharedContext.deactivate = (vnode: VNode) => {
            const instance = vnode.component!;
            move(vnode, storageContainer, null, MoveType.LEAVE, parentSuspense);
            queuePostRenderEffect(() => {
                if (instance.da) {
                    invokeArrayFns(instance.da);
                }
                const vnodeHook = vnode.props && vnode.props.onVnodeUnmounted;
                if (vnodeHook) {
                    invokeVNodeHook(vnodeHook, instance.parent, vnode);
                }
                instance.isDeactivated = true;
            }, parentSuspense);

            if (__DEV__ || __FEATURE_PROD_DEVTOOLS__) {
                // Update components tree
                devtoolsComponentAdded(instance);
            }
        };

        // Vue KeepAlive와 동일 함수
        function unmount(vnode: VNode) {
            resetShapeFlag(vnode);
            if (vnode.nextSibling) {
                _unmount(vnode, instance, parentSuspense, true);
            }
        }

        // 캐시 삭제
        function pruneCache(filter?: (name: string) => boolean) {
            cache.forEach((vnode, key) => {
                const name = getComponentName(vnode.type as ConcreteComponent);
                if (name && (!filter || !filter(name))) {
                    pruneCacheEntry(key);
                }
            });
        }

        // 캐시 삭제
        function pruneCacheEntry(key: CacheKey) {
            const cached = cache.get(key) as VNode;
            if (!current || !isSameVNodeType(cached, current)) {
                unmount(cached);
            } else if (current) {
                resetShapeFlag(current);
            }
            cache.delete(key);
            keys.delete(key);
        }

        let pendingCacheKey: CacheKey | null = null;

        /**
         * 세션 기준으로 삭제 대상 캐시 선정 후 삭제
         *
         * @param {menuSession} menuSession 현재 세션스토리지 'menu'에 값
         */
        function pruneSessionCache(menuSession: String[]) {
            cache.forEach((vnode, key) => {
                const name = getComponentName(vnode.type as ConcreteComponent);
                if (!menuSession.includes(name as string) && name != 'Dashboard') {
                    cache.delete(key);
                    keys.delete(key);
                }
                if (menuSession.length == 0 && name != 'Dashboard') {
                    unmount(vnode);

                    cache.delete(key);
                    keys.delete(key);
                }
            });
        }

        // 캐시 세팅
        function cacheSubtree() {
            if (pendingCacheKey != null) {
                // 신규 들어온 캐시의 컴퍼넌트가 기존에 있는 캐시 일 시 (key만 다를 경우 기존 캐시 캐시 삭제)
                if (typeof pendingCacheKey == 'number') {
                    const newComp = getComponentName(instance.subTree.type as ConcreteComponent);
                    cache.forEach((vnode, key) => {
                        const oldComp = getComponentName(vnode.type as ConcreteComponent);
                        if (oldComp == newComp) {
                            cache.delete(key);
                            keys.delete(key);
                        }
                    });
                }
                cache.set(pendingCacheKey, getInnerChild(instance.subTree));
            }
        }

        /**
         * 자식 컴퍼넌트 애니메이션 효과 추가
         * (current 변수가 가리키는 VNode에 클래스 추가)
         *
         * @param {current} current 현재 TnKeepAlive 태그 내에 렌더링 된 자식 컴퍼넌트
         */
        function addAnimationToCurrent(current: VNode | null) {
            if (current && current.el) {
                if (current.el.classList) {
                    current.el.classList.add('fade-in');

                    current.el.addEventListener('animationend', () => {
                        current.el.classList.remove('fade-in');
                    });
                } else {
                    warn('해당 컴퍼넌트는 div 태그로 감싸는 것을 권고 합니다.');

                    const parentElement = current.el.parentNode;

                    parentElement.classList.add('fade-in');

                    parentElement.addEventListener('animationend', () => {
                        parentElement.classList.remove('fade-in');
                    });
                }
            }
        }

        watch(
            () => [props.include, props.exclude, tnMenu.tnMnCasheList],
            ([include, exclude]) => {
                include && pruneCache((name) => matches(include as MatchPattern, name));
                exclude && pruneCache((name) => !matches(exclude as MatchPattern, name));

                pruneSessionCache(tnMenu.tnMnCasheList);
            },

            { flush: 'post', deep: true }
        );

        // 생명함수 정의
        onMounted(cacheSubtree);
        onUpdated(() => {
            cacheSubtree();
            addAnimationToCurrent(current);
        });

        onBeforeUnmount(() => {
            cache.forEach((cached) => {
                const { subTree, suspense } = instance;
                const vnode = getInnerChild(subTree);
                if (vnode && cached.type === vnode.type && cached.key === vnode.key) {
                    // vnode가 존재하는지 확인
                    // current instance will be unmounted as part of keep-alive's unmount
                    resetShapeFlag(vnode);
                    return;
                }
                unmount(cached);
            });
        });

        return () => {
            pendingCacheKey = null;

            if (!slots.slots.default) {
                return null;
            }

            const children = slots.slots.default();
            const rawVNode = children ? children[0] : null;

            if (!rawVNode) {
                return null;
            }

            if (children.length > 1) {
                if (__DEV__) {
                    warn(`TnKeepAlive should contain exactly one component child. (한 개의 자식 컴퍼넌트 권장)`);
                }
                current = null;
                return children;
            } else if (!(rawVNode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) && !(rawVNode.shapeFlag & ShapeFlags.SUSPENSE)) {
                current = null;
                return rawVNode;
            }

            let vnode = getInnerChild(rawVNode);

            const comp = vnode.type as ConcreteComponent;
            const isAsyncWrapper = (i: ComponentInternalInstance | VNode): boolean => !!(i.type as ComponentOptions).__asyncLoader;
            const name = getComponentName(isAsyncWrapper(vnode) ? (vnode.type as ComponentOptions).__asyncResolved || {} : comp);

            const { include, exclude, max } = props;

            if ((include && (!name || !matches(include as MatchPattern, name))) || (exclude && name && matches(exclude as MatchPattern, name))) {
                current = vnode;
                return rawVNode;
            }

            const key = vnode.key == null ? comp : vnode.key;

            const cachedVNode = cache.get(key);

            if (vnode.el) {
                vnode = cloneVNode(vnode);
                if (rawVNode.shapeFlag & ShapeFlags.SUSPENSE) {
                    rawVNode.ssContent = vnode;
                }
            }

            pendingCacheKey = key;

            if (cachedVNode) {
                // copy over mounted state
                vnode.el = cachedVNode.el;
                vnode.component = cachedVNode.component;
                if (vnode.transition) {
                    // recursively update transition hooks on subTree
                    setTransitionHooks(vnode, vnode.transition!);
                }
                // avoid vnode being mounted as fresh
                vnode.shapeFlag |= ShapeFlags.COMPONENT_KEPT_ALIVE;
                // make this key the freshest
                keys.delete(key);
                keys.add(key);
            } else {
                keys.add(key);
                // prune oldest entry
                if (max && keys.size > parseInt(max as string, 10)) {
                    pruneCacheEntry(keys.values().next().value);
                }
            }
            // avoid vnode being unmounted
            vnode.shapeFlag |= ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE;

            current = vnode;

            return isSuspense(rawVNode.type) ? rawVNode : vnode;
        };
    }
});

/** Vue KeepAlive 변수 및 함수 */
function getComponentName(Component: ConcreteComponent, includeInferred = true): string | false | undefined {
    return isFunction(Component) ? Component.displayName || Component.name : Component.name || (includeInferred && Component.__name);
}

function resetShapeFlag(vnode: VNode) {
    vnode.shapeFlag &= ~ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE;
    vnode.shapeFlag &= ~ShapeFlags.COMPONENT_KEPT_ALIVE;
}

function getInnerChild(vnode: VNode) {
    return vnode.shapeFlag & ShapeFlags.SUSPENSE ? vnode.ssContent! : vnode;
}

const hmrDirtyComponents = /* @__PURE__ */ new Set();

function isSameVNodeType(n1: VNode, n2: VNode) {
    if (n2.shapeFlag & 6 && hmrDirtyComponents.has(n2.type)) {
        n1.shapeFlag &= ~256;
        n2.shapeFlag &= ~512;
        return false;
    }
    return n1.type === n2.type && n1.key === n2.key;
}

function matches(pattern: MatchPattern, name: string): boolean {
    if (isArray(pattern)) {
        return pattern.some((p: string | RegExp) => matches(p, name));
    } else if (isString(pattern)) {
        return pattern.split(',').includes(name);
    } else if (isRegExp(pattern)) {
        return pattern.test(name);
    }
    return false;
}

const isSuspense = (type: any): boolean => type.__isSuspense;
const queuePostRenderEffect = queueEffectWithSuspense;
const devtoolsComponentAdded = /* @__PURE__ */ createDevtoolsComponentHook('component:added' /* COMPONENT_ADDED */);
function createDevtoolsComponentHook(hook) {
    return (component) => {
        emit$1(hook, component.appContext.app, component.uid, component.parent ? component.parent.uid : void 0, component);
    };
}
let devtools$1;
let buffer = [];
let devtoolsNotInstalled = false;
function emit$1(event, ...args) {
    if (devtools$1) {
        devtools$1.emit(event, ...args);
    } else if (!devtoolsNotInstalled) {
        buffer.push({ event, args });
    }
}
function queueEffectWithSuspense(fn, suspense) {
    if (suspense && suspense.pendingBranch) {
        if (isArray(fn)) {
            suspense.effects.push(...fn);
        } else {
            suspense.effects.push(fn);
        }
    } else {
        queuePostFlushCb(fn);
    }
}

let activePostFlushCbs = null;
let postFlushIndex = 0;
const pendingPostFlushCbs = [];

function queuePostFlushCb(cb) {
    if (!isArray(cb)) {
        if (!activePostFlushCbs || !activePostFlushCbs.includes(cb, cb.allowRecurse ? postFlushIndex + 1 : postFlushIndex)) {
            pendingPostFlushCbs.push(cb);
        }
    } else {
        pendingPostFlushCbs.push(...cb);
    }
    queueFlush();
}

let isFlushing = false;
let isFlushPending = false;
let currentFlushPromise = null;
const resolvedPromise = /* @__PURE__ */ Promise.resolve();
const queue = [];
let flushIndex = 0;
const getId = (job) => (job.id == null ? Infinity : job.id);
const comparator = (a, b) => {
    const diff = getId(a) - getId(b);
    if (diff === 0) {
        if (a.pre && !b.pre) return -1;
        if (b.pre && !a.pre) return 1;
    }
    return diff;
};
function callWithErrorHandling(fn?, instance?, type?, args?) {
    try {
        return args ? fn(...args) : fn();
    } catch (err) {
        handleError(err, instance, type);
    }
}

function flushJobs(seen) {
    isFlushPending = false;
    isFlushing = true;
    {
        seen = seen || /* @__PURE__ */ new Map();
    }
    queue.sort(comparator);
    const check = (job) => checkRecursiveUpdates(seen, job);
    try {
        for (flushIndex = 0; flushIndex < queue.length; flushIndex++) {
            const job = queue[flushIndex];
            if (job && job.active !== false) {
                if (check(job)) {
                    continue;
                }
                callWithErrorHandling(job, null, 14);
            }
        }
    } finally {
        flushIndex = 0;
        queue.length = 0;
        flushPostFlushCbs(seen);
        isFlushing = false;
        currentFlushPromise = null;
        if (queue.length || pendingPostFlushCbs.length) {
            flushJobs(seen);
        }
    }
}
function flushPostFlushCbs(seen) {
    if (pendingPostFlushCbs.length) {
        const deduped = [...new Set(pendingPostFlushCbs)].sort((a, b) => getId(a) - getId(b));
        pendingPostFlushCbs.length = 0;
        if (activePostFlushCbs) {
            activePostFlushCbs.push(...deduped);
            return;
        }
        activePostFlushCbs = deduped;
        {
            seen = seen || /* @__PURE__ */ new Map();
        }
        for (postFlushIndex = 0; postFlushIndex < activePostFlushCbs.length; postFlushIndex++) {
            if (checkRecursiveUpdates(seen, activePostFlushCbs[postFlushIndex])) {
                continue;
            }
            activePostFlushCbs[postFlushIndex]();
        }
        activePostFlushCbs = null;
        postFlushIndex = 0;
    }
}

function checkRecursiveUpdates(seen, fn) {
    if (!seen.has(fn)) {
        seen.set(fn, 1);
    } else {
        const count = seen.get(fn);
        if (count > 100) {
            const instance = fn.ownerInstance;
            const componentName = instance && getComponentName(instance.type);
            handleError(
                `Maximum recursive updates exceeded${
                    componentName ? ` in component <${componentName}>` : ``
                }. This means you have a reactive effect that is mutating its own dependencies and thus recursively triggering itself. Possible sources include component template, render function, updated hook or watcher source function.`,
                null,
                10
            );
            return true;
        } else {
            seen.set(fn, count + 1);
        }
    }
}

function queueFlush() {
    if (!isFlushing && !isFlushPending) {
        isFlushPending = true;
        currentFlushPromise = resolvedPromise.then(flushJobs);
    }
}

function invokeVNodeHook(hook, instance, vnode, prevVNode = null) {
    callWithAsyncErrorHandling(hook, instance, 7, [vnode, prevVNode]);
}

export default TnKeepAlive;
