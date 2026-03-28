<template>
    <z-tabs v-model="editableTabsValue" type="card" editable @tab-remove="removeTabHandler" @tab-add="addTabHandler"
        class="request-tabs">
        <template #extra>
            <el-button link type="primary" @click="addTabHandler"></el-button>
            <el-select v-model="currentEnv" class="request-tabs__env-select" placeholder="选择环境">
                <el-option v-for="item in envOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
            <el-button plain @click="applyEnvHandler">设置环境</el-button>
        </template>

        <z-tab-pane v-for="item in editableTabs" :key="item.name" :label="item.title" :name="item.name">
            <RequestItem></RequestItem>
        </z-tab-pane>
    </z-tabs>
</template>

<script lang="ts" setup>
    import { ref } from 'vue'
    import type { TabPaneName } from 'element-plus'
    import RequestItem from './RequestItem.vue'

    const editableTabsValue = ref('24')
    const currentEnv = ref('dev')
    const envOptions = [
        { label: '开发环境', value: 'dev' },
        { label: '测试环境', value: 'test' },
        { label: '预发环境', value: 'staging' },
        { label: '正式环境', value: 'prod' },
    ]
    const editableTabs = ref([
        {
            title: 'Tab 1dfghjkjhg',
            name: '1-',
            content: 'Tab 1 content',
        },
        {
            title: 'Tab 2就啊深刻的积分卡老师',
            name: '24',
            content: '1234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890',
        },
        {
            title: 'Tab 1dfghjkjhg',
            name: '12',
            content: 'Tab 1 content',
        },
        {
            title: 'Tab 1dfghjkjhg',
            name: '13',
            content: 'Tab 1 content',
        },
        {
            title: 'Tab 1dfghjkjhg',
            name: '14',
            content: 'Tab 1 content',
        },
    ])

    const removeTabHandler = (
        targetName: TabPaneName | undefined,
    ) => {
        const tabs = editableTabs.value
        let activeName = editableTabsValue.value
        if (activeName === targetName) {
            tabs.forEach((tab, index) => {
                if (tab.name === targetName) {
                    const nextTab = tabs[index + 1] || tabs[index - 1]
                    if (nextTab) {
                        activeName = nextTab.name
                    }
                }
            })
        }
        editableTabsValue.value = activeName
        editableTabs.value = tabs.filter((tab) => tab.name !== targetName)
    }

    const addTabHandler = (): void => {
        const newName = `tab-${Date.now()}`
        const newTab = {
            title: `新建请求 ${editableTabs.value.length + 1}`,
            name: newName,
            content: '',
        }
        const currentIndex = editableTabs.value.findIndex((tab) => tab.name === editableTabsValue.value)
        if (currentIndex === -1) {
            editableTabs.value.push(newTab)
        } else {
            editableTabs.value.splice(currentIndex + 1, 0, newTab)
        }
        editableTabsValue.value = newName
    }

    const applyEnvHandler = (): void => {
        console.log('current env:', currentEnv.value)
    }
</script>

<style>
    .request-tabs {
        width: 100%;
        min-width: 0;
    }

    .request-tabs :deep(.el-tabs__item) {
        max-width: 180px;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .request-tabs :deep(.el-tab-pane) {
        word-break: break-all;
    }

    .request-tabs :deep(.el-tabs__content) {
        padding: 32px;
        color: #6b778c;
        font-size: 32px;
        font-weight: 600;
    }

    .request-tabs__env-select {
        min-width: 168px;
        width: 168px;
    }
</style>
