<script setup lang="ts">
    import FunctionPanel from '../components/FunctionPanel.vue';
    import InterfacePanel from '../components/InterfacePanel.vue';
</script>

<template>
    <div class="splitter-wrapper">
        <el-splitter>
            <!-- 功能栏 -->
            <el-splitter-panel size="60px" min="60px" max="60px" style="width: 60px !important;">
                <function-panel></function-panel>
            </el-splitter-panel>
            <!-- 接口树 -->
            <el-splitter-panel size="200px" style="height: 100%;">
                <interface-panel></interface-panel>
            </el-splitter-panel>
            <el-splitter-panel>
                <div class="item-panel">2</div>
            </el-splitter-panel>
        </el-splitter>
    </div>
</template>

<style scoped>
    .splitter-wrapper {
        height: 100%;
    }

    .item-panel {
        display: flex;
        height: 100%;
    }
</style>
