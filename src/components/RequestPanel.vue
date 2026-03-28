<template>
    <el-tabs v-model="editableTabsValue" type="card" closable @tab-remove="removeTabHandler" class="request-tabs">
        <el-tab-pane v-for="item in editableTabs" :key="item.name" :label="item.title" :name="item.name">
            {{ item.content }}
        </el-tab-pane>
    </el-tabs>
</template>

<script lang="ts" setup>
    import { ref } from 'vue'
    import type { TabPaneName } from 'element-plus'

    const editableTabsValue = ref('24')
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
</style>
