<script lang="ts" setup>
    import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
    import Sortable from 'sortablejs'
    import { Delete, Rank } from '@element-plus/icons-vue'
    import ZVariableInput from './ZVariableInput.vue'

    type ValueTypeOption = {
        label: string
        value: string
    }

    type KeyValueRow = {
        id: number
        key: string
        value: string
        valueType?: string
        description: string
        enabled: boolean
    }

    const props = withDefaults(defineProps<{
        modelValue: KeyValueRow[]
        keyPlaceholder?: string
        valuePlaceholder?: string
        descriptionPlaceholder?: string
        hiddenValueTypes?: string[]
        tableHeight?: number | string
    }>(), {
        keyPlaceholder: 'Key',
        valuePlaceholder: 'Value',
        descriptionPlaceholder: 'Description',
        hiddenValueTypes: () => [],
        tableHeight: 280,
    })

    const defaultValueTypeOptions: ValueTypeOption[] = [
        { label: 'string', value: 'string' },
        { label: 'number', value: 'number' },
        { label: 'boolean', value: 'boolean' },
        { label: 'file', value: 'file' },
        { label: 'array', value: 'array' },
        { label: 'object', value: 'object' },
    ]

    const visibleValueTypeOptions = computed(() => {
        if (!props.hiddenValueTypes.length) {
            return defaultValueTypeOptions
        }

        const hiddenSet = new Set(props.hiddenValueTypes)
        return defaultValueTypeOptions.filter((item) => !hiddenSet.has(item.value))
    })

    const emit = defineEmits<{
        (event: 'update:modelValue', value: KeyValueRow[]): void
    }>()

    const tableRef = ref<{ $el?: HTMLElement } | null>(null)
    let sortable: Sortable | null = null

    const selectableRows = computed(() => {
        return props.modelValue.filter((item, index) => !isLockedTailRow(item, index))
    })

    const isAllChecked = computed(() => {
        return selectableRows.value.length > 0 && selectableRows.value.every((item) => item.enabled)
    })

    const isIndeterminate = computed(() => {
        const checkedCount = selectableRows.value.filter((item) => item.enabled).length
        return checkedCount > 0 && checkedCount < selectableRows.value.length
    })

    const toggleAll = (checked: boolean): void => {
        emit('update:modelValue', props.modelValue.map((item, index) => {
            if (isLockedTailRow(item, index)) {
                return item
            }

            return {
                ...item,
                enabled: checked,
            }
        }))
    }

    const removeRow = (id: number): void => {
        emit('update:modelValue', props.modelValue.filter((item) => item.id !== id))
    }

    const removeRowIfKeyEmpty = (row: KeyValueRow): void => {
        if (row.key.trim()) {
            return
        }

        removeRow(row.id)
    }

    const isLockedTailRow = (row: KeyValueRow, rowIndex: number): boolean => {
        const isLastRow = rowIndex === props.modelValue.length - 1
        return isLastRow && !row.key.trim()
    }

    const rowClassName = ({ row, rowIndex }: { row: KeyValueRow; rowIndex: number }): string => {
        const classNames: string[] = []

        if (!row.enabled) {
            classNames.push('z-param-table__row--unchecked')
        }

        if (isLockedTailRow(row, rowIndex)) {
            classNames.push('z-param-table__row--locked-tail')
        }

        return classNames.join(' ')
    }

    const setupRowDrag = (): void => {
        nextTick(() => {
            const tableEl = tableRef.value?.$el
            if (!tableEl) {
                return
            }

            const tbody = tableEl.querySelector('.el-table__body-wrapper tbody') as HTMLElement | null
            if (!tbody) {
                return
            }

            sortable?.destroy()
            sortable = Sortable.create(tbody, {
                animation: 160,
                handle: '.z-param-table__drag-handle',
                filter: '.z-param-table__drag-handle--disabled',
                preventOnFilter: false,
                ghostClass: 'z-param-table__drag-ghost',
                onEnd: (event: { oldIndex?: number; newIndex?: number }) => {
                    const { oldIndex, newIndex } = event
                    if (oldIndex === undefined || newIndex === undefined || oldIndex === newIndex) {
                        return
                    }

                    const dragRow = props.modelValue[oldIndex]
                    if (dragRow && isLockedTailRow(dragRow, oldIndex)) {
                        return
                    }

                    const nextRows = [...props.modelValue]
                    const [movedRow] = nextRows.splice(oldIndex, 1)
                    if (!movedRow) {
                        return
                    }

                    nextRows.splice(newIndex, 0, movedRow)
                    emit('update:modelValue', nextRows)
                },
            })
        })
    }

    onMounted(() => {
        setupRowDrag()
    })

    onBeforeUnmount(() => {
        sortable?.destroy()
        sortable = null
    })

    watch(
        () => props.modelValue.length,
        () => {
            setupRowDrag()
        },
    )
</script>

<template>
    <el-table ref="tableRef" :data="modelValue" :height="tableHeight" row-key="id" :row-class-name="rowClassName">
        <el-table-column width="60" align="center">
            <template #header>
                <div class="z-param-table__check-cell">
                    <span class="z-param-table__drag-placeholder" aria-hidden="true"></span>
                    <el-checkbox :model-value="isAllChecked" :indeterminate="isIndeterminate"
                        @change="toggleAll($event)"></el-checkbox>
                </div>
            </template>
            <template #default="scope">
                <div class="z-param-table__check-cell">
                    <template v-if="!isLockedTailRow(scope.row, scope.$index)">
                        <el-icon class="z-param-table__drag-handle">
                            <Rank />
                        </el-icon>
                        <el-checkbox v-model="scope.row.enabled" />
                    </template>
                </div>
            </template>
        </el-table-column>

        <el-table-column label="Key" min-width="220">
            <template #default="scope">
                <el-input v-model="scope.row.key" :placeholder="keyPlaceholder"
                    @blur="removeRowIfKeyEmpty(scope.row)" />
            </template>
        </el-table-column>

        <el-table-column label="Value" min-width="320">
            <template #default="scope">
                <div class="z-param-table__value-with-type">
                    <z-variable-input v-model="scope.row.value" :placeholder="valuePlaceholder" />
                    <el-select v-model="scope.row.valueType" class="z-param-table__value-type" placeholder="类型">
                        <el-option v-for="item in visibleValueTypeOptions" :key="item.value" :label="item.label"
                            :value="item.value" />
                    </el-select>
                </div>
            </template>
        </el-table-column>

        <el-table-column label="Description" min-width="220">
            <template #default="scope">
                <el-input v-model="scope.row.description" :placeholder="descriptionPlaceholder" />
            </template>
        </el-table-column>

        <el-table-column label="操作" width="60" align="center">
            <template #default="scope">
                <el-button link type="danger" @click="removeRow(scope.row.id)">
                    <el-icon>
                        <Delete />
                    </el-icon>
                </el-button>
            </template>
        </el-table-column>
    </el-table>
</template>

<style scoped>
    .z-param-table__value-with-type {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 92px;
        gap: 8px;
        align-items: center;
    }

    .z-param-table__value-type {
        width: 92px;
    }

    .z-param-table__check-cell {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
    }

    .z-param-table__drag-placeholder {
        width: 1em;
        height: 1em;
        flex: 0 0 auto;
    }

    .z-param-table__drag-handle {
        opacity: 0;
        pointer-events: none;
        cursor: grab;
        color: #9ca3af;
        transition: opacity 0.15s ease;
    }

    :deep(.el-table__body tr:hover .z-param-table__drag-handle) {
        opacity: 1;
        pointer-events: auto;
    }

    :deep(.sortable-chosen .z-param-table__drag-handle),
    :deep(.sortable-drag .z-param-table__drag-handle) {
        opacity: 1;
        pointer-events: auto;
        cursor: grabbing;
    }

    :deep(.z-param-table__drag-ghost) {
        opacity: 0.6;
        background: #eef2ff;
    }

    :deep(.el-table__body tr.z-param-table__row--unchecked) {
        opacity: 0.55;
    }

    :deep(.el-table__body tr.z-param-table__row--unchecked .el-input__wrapper),
    :deep(.el-table__body tr.z-param-table__row--unchecked .el-select__wrapper) {
        background-color: #f3f4f6;
    }

</style>
