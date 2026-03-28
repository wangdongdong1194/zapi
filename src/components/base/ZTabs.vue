<script setup lang="ts">
    import {
        cloneVNode,
        Comment,
        computed,
        defineComponent,
        nextTick,
        ref,
        Text,
        useSlots,
        watch,
        type PropType,
        type VNode,
    } from 'vue'

    type TabName = string | number

    interface TabPaneNode {
        vnode: VNode
        label: string
        name: TabName
        closable: boolean
        disabled: boolean
    }

    const props = withDefaults(
        defineProps<{
            modelValue?: TabName
            type?: 'line' | 'card'
            closable?: boolean
            editable?: boolean
            addable?: boolean
        }>(),
        {
            type: 'line',
            closable: false,
            editable: false,
            addable: false,
        },
    )

    const emit = defineEmits<{
        (event: 'update:modelValue', name: TabName): void
        (event: 'tab-click', name: TabName): void
        (event: 'tab-change', name: TabName): void
        (event: 'tab-remove', name: TabName): void
        (event: 'tab-add'): void
        (event: 'edit', targetName: TabName | undefined, action: 'add' | 'remove'): void
    }>()

    const slots = useSlots()
    const navWrapRef = ref<HTMLElement | null>(null)

    const flattenNodes = (nodes: VNode[] = []): VNode[] => {
        const result: VNode[] = []
        for (const node of nodes) {
            if (!node || node.type === Comment) {
                continue
            }

            if (node.type === Text) {
                const content = String(node.children ?? '').trim()
                if (!content) {
                    continue
                }
            }

            if (Array.isArray(node.children)) {
                result.push(...flattenNodes(node.children as VNode[]))
                continue
            }

            result.push(node)
        }

        return result
    }

    const panes = computed<TabPaneNode[]>(() => {
        const nodes = flattenNodes(slots.default?.() ?? [])

        return nodes.map((node, index) => {
            const paneProps = (node.props ?? {}) as Record<string, unknown>
            const label = String(paneProps.label ?? `Tab ${index + 1}`)
            const name = (paneProps.name as TabName | undefined) ?? String(index)
            const closable = paneProps.closable === undefined ? (props.editable || props.closable) : Boolean(paneProps.closable)
            const disabled = Boolean(paneProps.disabled)

            return {
                vnode: node,
                label,
                name,
                closable,
                disabled,
            }
        })
    })

    const innerActiveName = ref<TabName>('')

    const activeName = computed<TabName>(() => {
        return (props.modelValue ?? innerActiveName.value) as TabName
    })

    const activePane = computed(() => {
        return panes.value.find((pane) => pane.name === activeName.value) ?? panes.value[0]
    })

    const VNodeRenderer = defineComponent({
        name: 'VNodeRenderer',
        props: {
            vnode: {
                type: Object as PropType<VNode>,
                required: true,
            },
        },
        setup(rendererProps) {
            return () => cloneVNode(rendererProps.vnode)
        },
    })

    const ensureActive = (): void => {
        if (!panes.value.length) {
            innerActiveName.value = ''
            return
        }

        const target = props.modelValue ?? innerActiveName.value
        const exists = panes.value.some((pane) => pane.name === target && !pane.disabled)
        if (exists) {
            innerActiveName.value = target
            return
        }

        const first = panes.value.find((pane) => !pane.disabled)
        if (first) {
            innerActiveName.value = first.name
            emit('update:modelValue', first.name)
            emit('tab-change', first.name)
        }
    }

    const setActive = (name: TabName): void => {
        const pane = panes.value.find((item) => item.name === name)
        if (!pane || pane.disabled) {
            return
        }

        if (activeName.value === name) {
            emit('tab-click', name)
            return
        }

        innerActiveName.value = name
        emit('update:modelValue', name)
        emit('tab-change', name)
        emit('tab-click', name)

        nextTick(() => {
            scrollActiveIntoView()
        })
    }

    const removePane = (name: TabName): void => {
        emit('tab-remove', name)
        emit('edit', name, 'remove')

        if (activeName.value !== name) {
            return
        }

        nextTick(() => {
            ensureActive()
        })
    }

    const addPane = (): void => {
        emit('tab-add')
        emit('edit', undefined, 'add')
    }

    const scrollActiveIntoView = (): void => {
        const navWrap = navWrapRef.value
        if (!navWrap) {
            return
        }

        const activeEl = navWrap.querySelector<HTMLElement>('.z-tabs__item.is-active')
        if (!activeEl) {
            return
        }

        const wrapLeft = navWrap.scrollLeft
        const wrapRight = wrapLeft + navWrap.clientWidth
        const itemLeft = activeEl.offsetLeft
        const itemRight = itemLeft + activeEl.offsetWidth

        if (itemLeft < wrapLeft) {
            navWrap.scrollTo({ left: itemLeft, behavior: 'smooth' })
            return
        }

        if (itemRight > wrapRight) {
            navWrap.scrollTo({ left: itemRight - navWrap.clientWidth, behavior: 'smooth' })
        }
    }

    watch(
        () => props.modelValue,
        () => {
            ensureActive()
            nextTick(() => {
                scrollActiveIntoView()
            })
        },
    )

    watch(
        () => panes.value.map((pane) => pane.name).join('|'),
        () => {
            ensureActive()
            nextTick(() => {
                scrollActiveIntoView()
            })
        },
        { immediate: true },
    )

    const showAddButton = computed(() => props.editable || props.addable)
</script>

<template>
    <div class="z-tabs" :class="[`is-${type}`]">
        <div class="z-tabs__header">
            <div ref="navWrapRef" class="z-tabs__nav-wrap">
                <div class="z-tabs__nav">
                    <button v-for="pane in panes" :key="pane.name" class="z-tabs__item" type="button"
                        :class="{ 'is-active': pane.name === activeName, 'is-disabled': pane.disabled }"
                        :disabled="pane.disabled" @click="setActive(pane.name)">
                        <span class="z-tabs__label">{{ pane.label }}</span>
                        <span v-if="pane.closable" class="z-tabs__close" @click.stop="removePane(pane.name)">
                            ×
                        </span>
                    </button>
                </div>
            </div>

            <button v-if="showAddButton" class="z-tabs__add" type="button" @click="addPane">
                <slot name="add-icon">+</slot>
            </button>

            <div v-if="$slots.extra" class="z-tabs__extra">
                <slot name="extra" />
            </div>
        </div>

        <div class="z-tabs__content">
            <VNodeRenderer v-if="activePane" :vnode="activePane.vnode" />
        </div>
    </div>
</template>

<style scoped>
    .z-tabs {
        width: 100%;
        height: 100%;
        min-width: 0;
        display: flex;
        flex-direction: column;
        background: #fff;
    }

    .z-tabs__header {
        display: flex;
        align-items: center;
        gap: 8px;
        border-bottom: 1px solid #dcdfe6;
        background: #f5f7fa;
        padding-right: 8px;
        min-height: 40px;
    }

    .z-tabs__nav-wrap {
        flex: 1;
        min-width: 0;
        overflow: auto hidden;
        -ms-overflow-style: none;
        scrollbar-width: none;
    }

    .z-tabs__nav-wrap::-webkit-scrollbar {
        width: 0;
        height: 0;
        display: none;
    }

    .z-tabs__nav {
        display: inline-flex;
        white-space: nowrap;
        min-width: max-content;
    }

    .z-tabs__item {
        border: 0;
        border-right: 1px solid #ebeef5;
        background: transparent;
        color: #606266;
        height: 40px;
        padding: 0 12px;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        font-size: 13px;
        min-width: 84px;
        max-width: 220px;
    }

    .z-tabs__item.is-active {
        background: #fff;
        color: #303133;
    }

    .z-tabs.is-line .z-tabs__item.is-active {
        border-bottom: 2px solid #409eff;
    }

    .z-tabs.is-card .z-tabs__item {
        border: 1px solid #dcdfe6;
        border-bottom: 0;
        margin-top: 4px;
        margin-right: 6px;
        border-top-left-radius: 6px;
        border-top-right-radius: 6px;
        height: 36px;
    }

    .z-tabs.is-card .z-tabs__item.is-active {
        margin-bottom: -1px;
    }

    .z-tabs__label {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .z-tabs__close {
        font-size: 14px;
        line-height: 1;
        color: #909399;
    }

    .z-tabs__close:hover {
        color: #303133;
    }

    .z-tabs__add {
        width: 26px;
        height: 26px;
        border: 1px solid #dcdfe6;
        border-radius: 6px;
        background: #fff;
        cursor: pointer;
        color: #606266;
        flex: 0 0 auto;
    }

    .z-tabs__extra {
        display: inline-flex;
        align-items: center;
        flex: 0 0 auto;
    }

    .z-tabs__content {
        flex: 1;
        min-height: 0;
        overflow: auto;
    }
</style>
