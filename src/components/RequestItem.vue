<script lang="ts" setup>
    import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
    import ZParamTable from './base/ZParamTable.vue'
    import { ElMessage } from 'element-plus'

    type RequestMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
    type PairRow = {
        id: number
        key: string
        value: string
        valueType: 'string' | 'number' | 'boolean' | 'file' | 'array' | 'object' | 'null'
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
        valueType: 'string',
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

    const bodyFormDataRows = ref<PairRow[]>([
        createRow('file', '', '文件或字段内容'),
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

    let errorListener: ((event: any, message: string) => void) | null = null
    let successListener: ((event: any, message: any) => void) | null = null

    const sendRequest = (): void => {
        // 结构化克隆，避免包含 Proxy、循环引用等不可克隆对象
        let payload: any
        try {
            payload = JSON.parse(JSON.stringify({
                ...requestForm,
                bodyMode: bodyMode.value,
                bodyFormData: bodyFormDataRows.value,
                params: paramsRows.value,
                headers: headerRows.value,
                cookies: cookieRows.value,
            }))
        } catch (err) {
            ElMessage.error('请求数据序列化失败，无法发送到 Electron')
            return
        }
        try {
            if (window.electron && typeof window.electron.send === 'function') {
                window.electron.send('request:send', payload)
                // 监听成功事件
                if (!successListener) {
                    successListener = (_event, message) => {
                        ElMessage.success('Electron 处理成功1: ' + (message?.ok ? 'OK' : JSON.stringify(message)))
                    }
                    if (window.electron.on) window.electron.on('request:send:success', successListener)
                    else if (window.electron.addListener) window.electron.addListener('request:send:success', successListener)
                }
            } else if (window.ipcRenderer && typeof window.ipcRenderer.send === 'function') {
                window.ipcRenderer.send('request:send', payload)
                if (!successListener) {
                    successListener = (_event, message) => {
                        ElMessage.success('Electron 处理成功2: ' + (message?.ok ? 'OK' : JSON.stringify(message)))
                    }
                    if (window.ipcRenderer.on) window.ipcRenderer.on('request:send:success', successListener)
                    else if (window.ipcRenderer.addListener) window.ipcRenderer.addListener('request:send:success', successListener)
                }
            } else {
                ElMessage.error('未检测到 Electron 通信接口，无法发送请求')
                return
            }
            ElMessage.success('请求已发送到 Electron')
        } catch (err: any) {
            ElMessage.error('发送请求到 Electron 失败: ' + (err?.message || err))
        }
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
        if (errorListener && window.ipcRenderer && typeof window.ipcRenderer.off === 'function') {
            window.ipcRenderer.off('request:send:error', errorListener)
        }
        if (errorListener && window.electron) {
            const electron = window.electron
            if (electron.off) electron.off('request:send:error', errorListener)
            else if (electron.removeListener) electron.removeListener('request:send:error', errorListener)
        }
        if (successListener && window.ipcRenderer && typeof window.ipcRenderer.off === 'function') {
            window.ipcRenderer.off('request:send:success', successListener)
        }
        if (successListener && window.electron) {
            const electron = window.electron
            if (electron.off) electron.off('request:send:success', successListener)
            else if (electron.removeListener) electron.removeListener('request:send:success', successListener)
        }
        successListener = null
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
        bodyFormDataRows,
        () => {
            ensureTrailingBlankRow(bodyFormDataRows.value)
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
                        <z-param-table v-model="paramsRows" key-placeholder="参数名" value-placeholder="参数值"
                            description-placeholder="描述" table-height="100%" class="request-item__param-table" />
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

                        <z-param-table v-if="bodyMode === 'form-data'" v-model="bodyFormDataRows" key-placeholder="字段名"
                            value-placeholder="字段值" description-placeholder="描述" table-height="100%"
                            class="request-item__param-table" />

                        <el-input v-else v-model="requestForm.bodyText" type="textarea" :rows="12" resize="none"
                            placeholder="请输入 Body 内容" />
                    </el-tab-pane>

                    <el-tab-pane label="Headers" name="headers">
                        <z-param-table v-model="headerRows" key-placeholder="Header 名称" value-placeholder="Header 值"
                            description-placeholder="描述" :hidden-value-types="['file', 'object']" table-height="100%"
                            class="request-item__param-table" />
                    </el-tab-pane>

                    <el-tab-pane label="Cookies" name="cookies">
                        <z-param-table v-model="cookieRows" key-placeholder="Cookie 名称" value-placeholder="Cookie 值"
                            description-placeholder="描述" table-height="100%" class="request-item__param-table" />
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
        display: flex;
        flex-direction: column;
        min-height: 0;
    }

    .request-item__param-table {
        flex: 1;
        min-height: 0;
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