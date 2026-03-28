<script setup lang="ts">
    import {
        cloneVNode,
        Comment,
        computed,
        defineComponent,
        nextTick,
        onBeforeUnmount,
        onMounted,
        ref,
        Text,
        useSlots,
        watch,
        type CSSProperties,
        type PropType,
        type VNode,
    } from "vue";

    type SplitterLayout = "horizontal" | "vertical";
    type SizeValue = string | number | undefined;

    interface PanelLimit {
        min: number;
        max: number;
        size?: SizeValue;
    }

    const props = withDefaults(
        defineProps<{
            layout?: SplitterLayout;
            gutterSize?: number;
            disabled?: boolean;
        }>(),
        {
            layout: "horizontal",
            gutterSize: 6,
            disabled: false,
        },
    );

    const emit = defineEmits<{
        (event: "change", sizes: number[]): void;
    }>();

    const slots = useSlots();
    const containerRef = ref<HTMLElement | null>(null);
    const panelSizes = ref<number[]>([]);
    const containerLength = ref(0);

    const isHorizontal = computed(() => props.layout === "horizontal");
    const isDragging = ref(false);

    const VNodeRenderer = defineComponent({
        name: "VNodeRenderer",
        props: {
            vnode: {
                type: Object as PropType<VNode>,
                required: true,
            },
        },
        setup(rendererProps) {
            return () => cloneVNode(rendererProps.vnode);
        },
    });

    const flattenPanels = (nodes: VNode[] = []): VNode[] => {
        const result: VNode[] = [];

        for (const node of nodes) {
            if (!node) {
                continue;
            }

            if (node.type === Comment) {
                continue;
            }

            if (node.type === Text) {
                const text = String(node.children ?? "").trim();
                if (!text) {
                    continue;
                }
            }

            if (Array.isArray(node.children)) {
                result.push(...flattenPanels(node.children as VNode[]));
                continue;
            }

            result.push(node);
        }

        return result;
    };

    const panelNodes = computed(() => flattenPanels(slots.default?.() ?? []));

    const getContainerLength = (): number => {
        const container = containerRef.value;
        if (!container) {
            return 0;
        }

        return isHorizontal.value ? container.clientWidth : container.clientHeight;
    };

    const getPanelsLength = (containerLengthValue: number, panelCount: number): number => {
        const gutterCount = Math.max(panelCount - 1, 0);
        const gutterTotal = gutterCount * props.gutterSize;
        return Math.max(containerLengthValue - gutterTotal, 0);
    };

    const parseSize = (value: SizeValue, base: number): number | undefined => {
        if (value === undefined || value === null || value === "") {
            return undefined;
        }

        if (typeof value === "number" && Number.isFinite(value)) {
            return value;
        }

        const raw = String(value).trim();
        if (!raw) {
            return undefined;
        }

        if (raw.endsWith("%")) {
            const percentage = Number.parseFloat(raw.slice(0, -1));
            if (Number.isFinite(percentage)) {
                return (base * percentage) / 100;
            }
        }

        if (raw.endsWith("px")) {
            const px = Number.parseFloat(raw.slice(0, -2));
            if (Number.isFinite(px)) {
                return px;
            }
        }

        const numeric = Number.parseFloat(raw);
        return Number.isFinite(numeric) ? numeric : undefined;
    };

    const panelLimit = (index: number, base: number): PanelLimit => {
        const vnode = panelNodes.value[index];
        const panelProps = (vnode?.props ?? {}) as Record<string, unknown>;

        const min = parseSize(panelProps.min as SizeValue, base) ?? 0;
        const maxRaw = parseSize(panelProps.max as SizeValue, base);
        const size = panelProps.size as SizeValue;

        let max = maxRaw ?? Number.POSITIVE_INFINITY;
        if (max < min) {
            max = min;
        }

        return {
            min,
            max,
            size,
        };
    };

    const clamp = (value: number, min: number, max: number): number => {
        return Math.min(Math.max(value, min), max);
    };

    const distributeToFit = (
        sizes: number[],
        limits: PanelLimit[],
        target: number,
    ): number[] => {
        const next = [...sizes];

        for (let i = 0; i < next.length; i += 1) {
            next[i] = clamp(next[i], limits[i].min, limits[i].max);
        }

        for (let loop = 0; loop < 24; loop += 1) {
            const current = next.reduce((sum, value) => sum + value, 0);
            let diff = target - current;

            if (Math.abs(diff) < 0.5) {
                break;
            }

            const grow = diff > 0;
            const candidates = next
                .map((value, index) => ({
                    index,
                    room: grow ? limits[index].max - value : value - limits[index].min,
                }))
                .filter((item) => item.room > 0.001);

            if (!candidates.length) {
                break;
            }

            let rest = Math.abs(diff);
            const delta = rest / candidates.length;

            for (const item of candidates) {
                if (rest <= 0) {
                    break;
                }

                const offset = Math.min(item.room, delta, rest);
                next[item.index] += grow ? offset : -offset;
                rest -= offset;
            }

            if (Math.abs(rest - Math.abs(diff)) < 0.0001) {
                break;
            }
        }

        return next;
    };

    const initializeSizes = (force = false): void => {
        const count = panelNodes.value.length;
        if (!count) {
            panelSizes.value = [];
            containerLength.value = 0;
            return;
        }

        const totalLength = getContainerLength();
        if (!totalLength) {
            return;
        }

        const panelsLength = getPanelsLength(totalLength, count);
        if (!panelsLength) {
            panelSizes.value = new Array<number>(count).fill(0);
            containerLength.value = 0;
            emit("change", [...panelSizes.value]);
            return;
        }

        const limits = panelNodes.value.map((_, index) =>
            panelLimit(index, panelsLength),
        );

        if (
            !force &&
            panelSizes.value.length === count &&
            containerLength.value > 0
        ) {
            if (containerLength.value !== panelsLength) {
                const ratio = panelsLength / containerLength.value;
                const scaled = panelSizes.value.map((value) => value * ratio);
                panelSizes.value = distributeToFit(scaled, limits, panelsLength);
                containerLength.value = panelsLength;
                emit("change", [...panelSizes.value]);
            }
            return;
        }

        const next = new Array<number>(count).fill(Number.NaN);
        const unresolved: number[] = [];
        let used = 0;

        for (let i = 0; i < count; i += 1) {
            const fixed = parseSize(limits[i].size, panelsLength);
            if (fixed === undefined) {
                unresolved.push(i);
                continue;
            }

            const bounded = clamp(fixed, limits[i].min, limits[i].max);
            next[i] = bounded;
            used += bounded;
        }

        const remain = Math.max(panelsLength - used, 0);
        const avg = unresolved.length ? remain / unresolved.length : 0;

        for (const index of unresolved) {
            next[index] = avg;
        }

        if (!unresolved.length && used > 0 && Math.abs(used - panelsLength) > 0.5) {
            const ratio = panelsLength / used;
            for (let i = 0; i < next.length; i += 1) {
                next[i] *= ratio;
            }
        }

        panelSizes.value = distributeToFit(next, limits, panelsLength);
        containerLength.value = panelsLength;
        emit("change", [...panelSizes.value]);
    };

    const dragState = ref<{
        index: number;
        start: number;
        startA: number;
        startB: number;
    } | null>(null);

    const onPointerMove = (event: PointerEvent): void => {
        const state = dragState.value;
        const totalLength = containerLength.value;

        if (!state || !totalLength) {
            return;
        }

        const current = isHorizontal.value ? event.clientX : event.clientY;
        const rawDelta = current - state.start;

        const limits = panelNodes.value.map((_, index) =>
            panelLimit(index, totalLength),
        );
        const leftLimit = limits[state.index];
        const rightLimit = limits[state.index + 1];

        const minDelta = Math.max(
            leftLimit.min - state.startA,
            state.startB - rightLimit.max,
        );
        const maxDelta = Math.min(
            leftLimit.max - state.startA,
            state.startB - rightLimit.min,
        );

        const delta = clamp(rawDelta, minDelta, maxDelta);

        const next = [...panelSizes.value];
        next[state.index] = state.startA + delta;
        next[state.index + 1] = state.startB - delta;

        panelSizes.value = next;
        emit("change", [...panelSizes.value]);
    };

    const stopDrag = (): void => {
        dragState.value = null;
        isDragging.value = false;
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", stopDrag);
    };

    const onPointerDown = (index: number, event: PointerEvent): void => {
        if (props.disabled || panelSizes.value.length < index + 2) {
            return;
        }

        event.preventDefault();

        const start = isHorizontal.value ? event.clientX : event.clientY;
        dragState.value = {
            index,
            start,
            startA: panelSizes.value[index],
            startB: panelSizes.value[index + 1],
        };

        isDragging.value = true;
        window.addEventListener("pointermove", onPointerMove);
        window.addEventListener("pointerup", stopDrag);
    };

    const panelStyle = (index: number): CSSProperties => {
        const size = panelSizes.value[index] ?? 0;

        if (isHorizontal.value) {
            return {
                width: `${size}px`,
                minWidth: 0,
                height: "100%",
            };
        }

        return {
            height: `${size}px`,
            minHeight: 0,
            width: "100%",
        };
    };

    const barStyle = computed<CSSProperties>(() => {
        if (isHorizontal.value) {
            return {
                width: `${props.gutterSize}px`,
                cursor: props.disabled ? "default" : "col-resize",
            };
        }

        return {
            height: `${props.gutterSize}px`,
            cursor: props.disabled ? "default" : "row-resize",
        };
    });

    let resizeObserver: ResizeObserver | null = null;

    onMounted(() => {
        nextTick(() => initializeSizes(true));

        resizeObserver = new ResizeObserver(() => {
            initializeSizes(false);
        });

        if (containerRef.value) {
            resizeObserver.observe(containerRef.value);
        }
    });

    onBeforeUnmount(() => {
        stopDrag();
        resizeObserver?.disconnect();
        resizeObserver = null;
    });

    watch(
        () => panelNodes.value.length,
        () => {
            nextTick(() => initializeSizes(true));
        },
    );

    watch(
        () => props.layout,
        () => {
            nextTick(() => initializeSizes(true));
        },
    );
</script>

<template>
    <div ref="containerRef" class="z-splitter" :class="{ 'is-vertical': !isHorizontal, 'is-dragging': isDragging }">
        <template v-for="(panel, index) in panelNodes" :key="index">
            <div class="z-splitter__panel" :style="panelStyle(index)">
                <VNodeRenderer :vnode="panel" />
            </div>

            <div v-if="index < panelNodes.length - 1" class="z-splitter__bar" :style="barStyle"
                @pointerdown="onPointerDown(index, $event)">
                <div class="z-splitter__thumb"></div>
            </div>
        </template>
    </div>
</template>

<style scoped>
    .z-splitter {
        display: flex;
        flex-direction: row;
        width: 100%;
        height: 100%;
        overflow: hidden;
        user-select: none;
    }

    .z-splitter.is-vertical {
        flex-direction: column;
    }

    .z-splitter__panel {
        flex: 0 0 auto;
        overflow: hidden;
    }

    .z-splitter__bar {
        position: relative;
        flex: 0 0 auto;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #f5f7fa;
        transition: background-color 0.2s ease;
    }

    .z-splitter__bar:hover {
        background: #e4e7ed;
    }

    .z-splitter__thumb {
        border-radius: 999px;
        background: #c0c4cc;
    }

    .z-splitter:not(.is-vertical) .z-splitter__thumb {
        width: 3px;
        height: 24px;
    }

    .z-splitter.is-vertical .z-splitter__thumb {
        width: 24px;
        height: 3px;
    }

    .z-splitter.is-dragging {
        cursor: col-resize;
    }

    .z-splitter.is-dragging.is-vertical {
        cursor: row-resize;
    }
</style>
