<script lang="ts" setup>
    import { computed } from 'vue'
    import { Delete } from '@element-plus/icons-vue'
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

    const isAllChecked = computed(() => {
        return props.modelValue.length > 0 && props.modelValue.every((item) => item.enabled)
    })

    const isIndeterminate = computed(() => {
        const checkedCount = props.modelValue.filter((item) => item.enabled).length
        return checkedCount > 0 && checkedCount < props.modelValue.length
    })

    const toggleAll = (checked: boolean): void => {
        emit('update:modelValue', props.modelValue.map((item) => ({
            ...item,
            enabled: checked,
        })))
    }

    const removeRow = (id: number): void => {
        emit('update:modelValue', props.modelValue.filter((item) => item.id !== id))
    }
</script>

<template>
    <el-table :data="modelValue" border :height="tableHeight">
        <el-table-column width="60" align="center">
            <template #header>
                <el-checkbox :model-value="isAllChecked" :indeterminate="isIndeterminate"
                    @change="toggleAll($event)"></el-checkbox>
            </template>
            <template #default="scope">
                <el-checkbox v-model="scope.row.enabled" />
            </template>
        </el-table-column>

        <el-table-column label="Key" min-width="220">
            <template #default="scope">
                <el-input v-model="scope.row.key" :placeholder="keyPlaceholder" />
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
</style>
