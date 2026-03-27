<script setup lang="ts">
    import { ref, watch } from 'vue'
    import type { FilterNodeMethodFunction, TreeInstance } from 'element-plus'
    import { Document, Folder, FolderOpened } from '@element-plus/icons-vue'
    interface Tree {
        [key: string]: any
    }

    const filterText = ref('')
    const treeRef = ref<TreeInstance>()

    const defaultProps = {
        children: 'children',
        label: 'label',
    }

    watch(filterText, (val) => {
        treeRef.value!.filter(val)
    })

    const filterNode: FilterNodeMethodFunction = (value: string, data: Tree) => {
        if (!value) return true
        return data.label.includes(value)
    }

    const data: Tree[] = [
        {
            id: 1,
            label: 'Level one 1',
            children: [
                {
                    id: 4,
                    label: 'Level two 1-1啊时代峰峻啊就是看的反馈就啊水淀粉',
                    children: [
                        {
                            id: 9,
                            label: 'Level three 1-1-1',
                        },
                        {
                            id: 10,
                            label: 'Level three 1-1-2',
                        },
                    ],
                },
            ],
        },
        {
            id: 2,
            label: 'Level one 2',
            children: [
                {
                    id: 5,
                    label: 'Level two 2-1',
                },
                {
                    id: 6,
                    label: 'Level two 2-2',
                },
            ],
        },
        {
            id: 3,
            label: 'Level one 3',
            children: [
                {
                    id: 7,
                    label: 'Level two 3-1',
                },
                {
                    id: 8,
                    label: 'Level two 3-2',
                },
            ],
        },
    ]
</script>
<template>
    <div>
        <el-input v-model="filterText" placeholder="Filter keyword" />

        <el-tree 
            ref="treeRef" 
            style="max-width: 600px" 
            class="filter-tree" 
            :data="data" 
            :props="defaultProps"
            default-expand-all 
            :filter-node-method="filterNode" 
            draggable >
            <template #default="{ node }">
                <el-icon class="node-icon" :class="{ 'is-leaf': node.isLeaf }">
                    <Document v-if="node.isLeaf" />
                    <Folder v-else-if="!node.expanded" />
                    <FolderOpened v-else />
                </el-icon>
                <span>{{ node.label }}</span>
            </template>
        </el-tree>
    </div>
</template>
<style scoped>
    .iconComponent {
        padding: 5px;
    }
</style>