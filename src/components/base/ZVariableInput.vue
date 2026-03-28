<script lang="ts" setup>
    import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
    import type { InputInstance } from 'element-plus'

    const props = withDefaults(defineProps<{
        modelValue: string
        placeholder?: string
    }>(), {
        placeholder: '',
    })

    const emit = defineEmits<{
        (event: 'update:modelValue', value: string): void
    }>()

    const inputRef = ref<InputInstance>()
    const overlayRef = ref<HTMLElement | null>(null)
    const overlayContentRef = ref<HTMLElement | null>(null)
    let inputElement: HTMLInputElement | undefined
    let resizeObserver: ResizeObserver | undefined

    const escapeHtml = (value: string): string => {
        return value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
    }

    const overlayHtml = computed(() => {
        if (!props.modelValue) {
            if (!props.placeholder) {
                return ''
            }
            return `<span class="z-variable-input__placeholder">${escapeHtml(props.placeholder)}</span>`
        }

        return escapeHtml(props.modelValue).replace(/\{\{\s*[^{}\s]+\s*\}\}/g, (match) => {
            return `<span class="z-variable-input__token">${match}</span>`
        })
    })

    const syncOverlayScroll = (): void => {
        const inputEl = inputRef.value?.input
        const overlayContentEl = overlayContentRef.value
        if (!inputEl || !overlayContentEl) {
            return
        }

        overlayContentEl.style.transform = `translateX(${-inputEl.scrollLeft}px)`
    }

    const syncOverlayMetrics = (): void => {
        const inputEl = inputRef.value?.input
        const overlayEl = overlayRef.value
        const overlayContentEl = overlayContentRef.value
        const wrapperEl = inputEl?.closest('.el-input__wrapper') as HTMLElement | null
        if (!inputEl || !overlayEl || !overlayContentEl || !wrapperEl) {
            return
        }

        const inputStyles = window.getComputedStyle(inputEl)
        const leftInset = inputEl.offsetLeft
        const rightInset = Math.max(0, wrapperEl.clientWidth - inputEl.offsetLeft - inputEl.clientWidth)

        overlayEl.style.left = `${leftInset}px`
        overlayEl.style.right = `${rightInset}px`
        overlayEl.style.top = `${inputEl.offsetTop}px`
        overlayEl.style.height = `${inputEl.clientHeight}px`

        overlayContentEl.style.fontFamily = inputStyles.fontFamily
        overlayContentEl.style.fontSize = inputStyles.fontSize
        overlayContentEl.style.fontWeight = inputStyles.fontWeight
        overlayContentEl.style.letterSpacing = inputStyles.letterSpacing
        overlayContentEl.style.lineHeight = inputStyles.lineHeight
        overlayContentEl.style.textTransform = inputStyles.textTransform

        syncOverlayScroll()
    }

    const updateValue = (value: string): void => {
        emit('update:modelValue', value)
        nextTick(() => {
            syncOverlayMetrics()
            syncOverlayScroll()
        })
    }

    const handleInput = (): void => {
        syncOverlayScroll()
    }

    onMounted(() => {
        inputElement = inputRef.value?.input
        inputElement?.addEventListener('scroll', syncOverlayScroll)

        const wrapperEl = inputElement?.closest('.el-input__wrapper') as HTMLElement | null
        resizeObserver = new ResizeObserver(() => {
            syncOverlayMetrics()
        })

        if (inputElement) {
            resizeObserver.observe(inputElement)
        }
        if (wrapperEl) {
            resizeObserver.observe(wrapperEl)
        }

        window.addEventListener('resize', syncOverlayMetrics)

        nextTick(() => {
            syncOverlayMetrics()
            syncOverlayScroll()
        })
    })

    onBeforeUnmount(() => {
        inputElement?.removeEventListener('scroll', syncOverlayScroll)
        window.removeEventListener('resize', syncOverlayMetrics)
        resizeObserver?.disconnect()
    })
</script>

<template>
    <div class="z-variable-input">
        <div ref="overlayRef" class="z-variable-input__overlay" aria-hidden="true">
            <div ref="overlayContentRef" class="z-variable-input__overlay-content" v-html="overlayHtml"></div>
        </div>
        <el-input :model-value="modelValue" :placeholder="placeholder" class="z-variable-input__control" ref="inputRef"
            @update:model-value="updateValue" @input="handleInput" />
    </div>
</template>

<style scoped>
    .z-variable-input {
        position: relative;
    }

    .z-variable-input__overlay {
        position: absolute;
        left: 12px;
        right: 12px;
        top: 1px;
        bottom: 1px;
        display: flex;
        align-items: center;
        pointer-events: none;
        overflow: hidden;
        z-index: 1;
    }

    .z-variable-input__overlay-content {
        color: #000000;
        white-space: pre;
        will-change: transform;
        word-spacing: normal;
    }

    .z-variable-input__overlay :deep(.z-variable-input__token) {
        color: #1e3a8a;
        font-weight: 400;
        /* 解析{{}}后的背景颜色 */
        background: rgba(59, 130, 246, 0.12);
        border-radius: 3px;
    }

    .z-variable-input__overlay :deep(.z-variable-input__placeholder) {
        color: #a8abb2;
        font-weight: 400;
    }

    .z-variable-input :deep(.el-input__wrapper) {
        position: relative;
        z-index: 2;
        background: transparent;
    }

    .z-variable-input :deep(.el-input__inner) {
        color: transparent;
        caret-color: #303133;
        position: relative;
        z-index: 3;
    }

    .z-variable-input :deep(.el-input__inner::placeholder) {
        color: transparent;
    }
</style>
