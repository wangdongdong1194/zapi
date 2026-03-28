<script lang="ts" setup>
    import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
    import { Delete } from '@element-plus/icons-vue'

    type RequestMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
    type PairRow = {
        id: number
        key: string
        value: string
        description: string
        enabled: boolean
    }

    const activeTab = ref('params')
    const bodyMode = ref('json')
    const firstPanelHeight = ref('96px')
    const firstPanelContentRef = ref<HTMLElement | null>(null)
    let firstPanelResizeObserver: ResizeObserver | null = null
    let firstPanelChildrenResizeObserver: ResizeObserver | null = null
    let firstPanelMutationObserver: MutationObserver | null = null
    const bodyModeOptions = [
        { label: 'JSON', value: 'json' },
        { label: 'Text', value: 'text' },
        { label: 'XML', value: 'xml' },
        { label: 'Form Data', value: 'form-data' },
    ]
    const requestForm = reactive({
        name: '获取用户列表',
        method: 'GET' as RequestMethod,
        url: '/api/examplecom/users',
        bodyText: '{\n  "page": 1,\n  "size": 20\n}',
    })

    let rowId = 100
    const createRow = (key = '', value = '', description = ''): PairRow => ({
        id: rowId++,
        key,
        value,
        description,
        enabled: true,
    })

    const paramsRows = ref<PairRow[]>([
        createRow('page', '1', '页码'),
        createRow('size', '20', '每页数量'),
        createRow(),
    ])

    const headerRows = ref<PairRow[]>([
        createRow('Content-Type', 'application/json', '请求格式'),
        createRow('Authorization', 'Bearer token', '鉴权信息'),
        createRow(),
    ])

    const cookieRows = ref<PairRow[]>([
        createRow('sessionId', 'demo-session-id', '会话标识'),
        createRow(),
    ])

    const precedingURL = ref('http://www.baidu.com')
    const hasPrecedingURL = computed(() => precedingURL.value.trim().length > 0)

    const isEmptyRow = (row: PairRow): boolean => {
        return !row.key.trim() && !row.value.trim() && !row.description.trim()
    }

    const ensureTrailingBlankRow = (list: PairRow[]): void => {
        if (!list.length || !isEmptyRow(list[list.length - 1])) {
            list.push(createRow())
        }
    }

    const removeRow = (target: PairRow[], id: number): void => {
        const index = target.findIndex((item) => item.id === id)
        if (index >= 0) {
            target.splice(index, 1)
        }
    }

    const isAllChecked = (list: PairRow[]): boolean => {
        return list.length > 0 && list.every((item) => item.enabled)
    }

    const isIndeterminate = (list: PairRow[]): boolean => {
        const checkedCount = list.filter((item) => item.enabled).length
        return checkedCount > 0 && checkedCount < list.length
    }

    const toggleAll = (list: PairRow[], checked: boolean): void => {
        list.forEach((item) => {
            item.enabled = checked
        })
    }

    const sendRequest = (): void => {
        console.log('send request payload', {
            ...requestForm,
            bodyMode: bodyMode.value,
            params: paramsRows.value,
            headers: headerRows.value,
            cookies: cookieRows.value,
        })
    }

    const syncFirstPanelHeight = (): void => {
        const el = firstPanelContentRef.value
        if (!el) {
            return
        }

        firstPanelHeight.value = `${Math.ceil(el.scrollHeight)}px`
    }

    const observeFirstPanelChildren = (): void => {
        const el = firstPanelContentRef.value
        if (!el) {
            return
        }

        firstPanelChildrenResizeObserver?.disconnect()
        firstPanelChildrenResizeObserver = new ResizeObserver(() => {
            syncFirstPanelHeight()
        })

        Array.from(el.children).forEach((child) => {
            firstPanelChildrenResizeObserver?.observe(child)
        })
    }

    onMounted(() => {
        nextTick(() => {
            syncFirstPanelHeight()
        })

        firstPanelResizeObserver = new ResizeObserver(() => {
            syncFirstPanelHeight()
        })

        if (firstPanelContentRef.value) {
            firstPanelResizeObserver.observe(firstPanelContentRef.value)

            firstPanelMutationObserver = new MutationObserver(() => {
                observeFirstPanelChildren()
                syncFirstPanelHeight()
            })

            firstPanelMutationObserver.observe(firstPanelContentRef.value, {
                childList: true,
                subtree: true,
            })

            observeFirstPanelChildren()
        }
    })

    onBeforeUnmount(() => {
        firstPanelResizeObserver?.disconnect()
        firstPanelResizeObserver = null
        firstPanelChildrenResizeObserver?.disconnect()
        firstPanelChildrenResizeObserver = null
        firstPanelMutationObserver?.disconnect()
        firstPanelMutationObserver = null
    })

    watch(
        paramsRows,
        () => {
            ensureTrailingBlankRow(paramsRows.value)
        },
        { deep: true },
    )

    watch(
        headerRows,
        () => {
            ensureTrailingBlankRow(headerRows.value)
        },
        { deep: true },
    )

    watch(
        cookieRows,
        () => {
            ensureTrailingBlankRow(cookieRows.value)
        },
        { deep: true },
    )

    watch(
        () => requestForm.method,
        () => {
            nextTick(() => {
                syncFirstPanelHeight()
            })
        },
    )
</script>

<template>
    <div class="request-item">
        <z-splitter layout="vertical">
            <z-splitter-panel :size="firstPanelHeight" :min="firstPanelHeight" :max="firstPanelHeight">
                <div ref="firstPanelContentRef" class="request-item__top-content">
                    <div class="request-item__base">
                        <div class="request-item__field request-item__field--name">
                            <el-input v-model="requestForm.name" placeholder="请输入接口名称" />
                        </div>
                    </div>

                    <div class="request-item__url-row">
                        <div class="request-item__field request-item__field--method-inline">
                            <el-select v-model="requestForm.method" placeholder="选择请求方法">
                                <el-option label="GET" value="GET" />
                                <el-option label="POST" value="POST" />
                                <el-option label="PUT" value="PUT" />
                                <el-option label="PATCH" value="PATCH" />
                                <el-option label="DELETE" value="DELETE" />
                            </el-select>
                        </div>

                        <div class="request-item__field request-item__field--url">
                            <el-input v-model="requestForm.url" placeholder="请输入接口地址">
                                <template v-if="hasPrecedingURL" #prepend>
                                    {{ precedingURL }}
                                </template>
                            </el-input>
                        </div>

                        <el-button type="primary" class="request-item__send" @click="sendRequest">
                            发送
                        </el-button>
                    </div>
                </div>
            </z-splitter-panel>
            <z-splitter-panel>
                <el-tabs v-model="activeTab" class="request-item__tabs">
                    <el-tab-pane label="Params" name="params">
                        <el-table :data="paramsRows" border height="280">
                            <el-table-column width="60" align="center">
                                <template #header>
                                    <el-checkbox :model-value="isAllChecked(paramsRows)"
                                        :indeterminate="isIndeterminate(paramsRows)"
                                        @change="toggleAll(paramsRows, $event)"></el-checkbox>
                                </template>
                                <template #default="scope">
                                    <el-checkbox v-model="scope.row.enabled" />
                                </template>
                            </el-table-column>
                            <el-table-column label="Key" min-width="180">
                                <template #default="scope">
                                    <el-input v-model="scope.row.key" placeholder="参数名" />
                                </template>
                            </el-table-column>
                            <el-table-column label="Value" min-width="220">
                                <template #default="scope">
                                    <el-input v-model="scope.row.value" placeholder="参数值" />
                                </template>
                            </el-table-column>
                            <el-table-column label="Description" min-width="220">
                                <template #default="scope">
                                    <el-input v-model="scope.row.description" placeholder="描述" />
                                </template>
                            </el-table-column>
                            <el-table-column label="操作" width="60" align="center">
                                <template #default="scope">
                                    <el-button link type="danger" @click="removeRow(paramsRows, scope.row.id)">
                                        <el-icon>
                                            <Delete />
                                        </el-icon>
                                    </el-button>
                                </template>
                            </el-table-column>
                        </el-table>
                    </el-tab-pane>

                    <el-tab-pane label="Body" name="body">
                        <div class="request-item__tab-header">
                            <div class="request-item__body-mode-row">
                                <button v-for="option in bodyModeOptions" :key="option.value" type="button"
                                    class="request-item__body-mode-btn"
                                    :class="{ 'is-active': bodyMode === option.value }"
                                    @click="bodyMode = option.value">
                                    {{ option.label }}
                                </button>
                            </div>
                        </div>

                        <el-input v-model="requestForm.bodyText" type="textarea" :rows="12" resize="none"
                            placeholder="请输入 Body 内容" />
                    </el-tab-pane>

                    <el-tab-pane label="Headers" name="headers">
                        <el-table :data="headerRows" border height="280">
                            <el-table-column width="60" align="center">
                                <template #header>
                                    <el-checkbox :model-value="isAllChecked(headerRows)"
                                        :indeterminate="isIndeterminate(headerRows)"
                                        @change="toggleAll(headerRows, $event)"></el-checkbox>
                                </template>
                                <template #default="scope">
                                    <el-checkbox v-model="scope.row.enabled" />
                                </template>
                            </el-table-column>
                            <el-table-column label="Key" min-width="180">
                                <template #default="scope">
                                    <el-input v-model="scope.row.key" placeholder="Header 名称" />
                                </template>
                            </el-table-column>
                            <el-table-column label="Value" min-width="220">
                                <template #default="scope">
                                    <el-input v-model="scope.row.value" placeholder="Header 值" />
                                </template>
                            </el-table-column>
                            <el-table-column label="Description" min-width="220">
                                <template #default="scope">
                                    <el-input v-model="scope.row.description" placeholder="描述" />
                                </template>
                            </el-table-column>
                            <el-table-column label="操作" width="60" align="center">
                                <template #default="scope">
                                    <el-button link type="danger" @click="removeRow(headerRows, scope.row.id)">
                                        <el-icon>
                                            <Delete />
                                        </el-icon>
                                    </el-button>
                                </template>
                            </el-table-column>
                        </el-table>
                    </el-tab-pane>

                    <el-tab-pane label="Cookies" name="cookies">
                        <el-table :data="cookieRows" border height="280">
                            <el-table-column width="60" align="center">
                                <template #header>
                                    <el-checkbox :model-value="isAllChecked(cookieRows)"
                                        :indeterminate="isIndeterminate(cookieRows)"
                                        @change="toggleAll(cookieRows, $event)"></el-checkbox>
                                </template>
                                <template #default="scope">
                                    <el-checkbox v-model="scope.row.enabled" />
                                </template>
                            </el-table-column>
                            <el-table-column label="Key" min-width="180">
                                <template #default="scope">
                                    <el-input v-model="scope.row.key" placeholder="Cookie 名称" />
                                </template>
                            </el-table-column>
                            <el-table-column label="Value" min-width="220">
                                <template #default="scope">
                                    <el-input v-model="scope.row.value" placeholder="Cookie 值" />
                                </template>
                            </el-table-column>
                            <el-table-column label="Description" min-width="220">
                                <template #default="scope">
                                    <el-input v-model="scope.row.description" placeholder="描述" />
                                </template>
                            </el-table-column>
                            <el-table-column label="操作" width="60" align="center">
                                <template #default="scope">
                                    <el-button link type="danger" @click="removeRow(cookieRows, scope.row.id)">
                                        <el-icon>
                                            <Delete />
                                        </el-icon>
                                    </el-button>
                                </template>
                            </el-table-column>
                        </el-table>
                    </el-tab-pane>
                </el-tabs>
            </z-splitter-panel>
            <z-splitter-panel>
                <div style="height: 300px;width: 100px;"></div>
            </z-splitter-panel>
        </z-splitter>
    </div>
</template>

<style scoped>
    .request-item {
        height: 100%;
        display: flex;
        flex-direction: column;
        gap: 16px;
        padding: 16px;
        background: #f7f8fa;
    }

    .request-item__base,
    .request-item__url-row {
        display: grid;
        gap: 12px;
    }

    .request-item__top-content {
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding-bottom: 10px;
    }

    .request-item__base {
        grid-template-columns: minmax(0, 1fr);
    }

    .request-item__url-row {
        grid-template-columns: 160px minmax(0, 1fr) auto;
        align-items: end;
    }

    .request-item__field {
        display: flex;
        flex-direction: column;
        gap: 8px;
        min-width: 0;
    }

    .request-item__label {
        font-size: 13px;
        font-weight: 600;
        color: #4b5563;
    }

    .request-item__send {
        min-width: 88px;
    }

    .request-item__tabs {
        flex: 1;
        min-height: 0;
        padding: 8px 12px 12px;
        border-radius: 12px;
        background: #fff;
        box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
    }

    .request-item__tabs :deep(.el-tabs__content) {
        height: calc(100% - 56px);
    }

    .request-item__tabs :deep(.el-tab-pane) {
        height: 100%;
    }

    .request-item__tab-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12px;
        color: #111827;
        font-weight: 600;
    }

    .request-item__body-mode-row {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 4px;
        border: 1px solid #e5e7eb;
        border-radius: 10px;
        background: #f9fafb;
    }

    .request-item__body-mode-btn {
        border: 0;
        background: transparent;
        color: #4b5563;
        font-size: 13px;
        font-weight: 600;
        padding: 6px 12px;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .request-item__body-mode-btn:hover {
        color: #111827;
        background: #eef2ff;
    }

    .request-item__body-mode-btn.is-active {
        color: #1d4ed8;
        background: #dbeafe;
    }

    @media (max-width: 900px) {

        .request-item__base,
        .request-item__url-row {
            grid-template-columns: 1fr;
        }

        .request-item__send {
            width: 100%;
        }
    }
</style>