<script setup lang="ts">
    import FunctionPanel from '../components/FunctionPanel.vue';
    import InterfacePanel from '../components/InterfacePanel.vue';
import RequestPanel from '../components/RequestPanel.vue';
    import ZSplitter from '../components/base/ZSplitter.vue';
    import ZSplitterPanel from '../components/base/ZSplitterPanel.vue';
</script>

<template>
    <div class="splitter-wrapper">
        <z-splitter>
            <!-- 功能栏 -->
            <z-splitter-panel size="60px" min="60px" max="60px" style="width: 60px !important;">
                <function-panel></function-panel>
            </z-splitter-panel>
            <!-- 接口树 -->
            <z-splitter-panel size="200px" style="height: 100%;">
                <interface-panel></interface-panel>
            </z-splitter-panel>
            <z-splitter-panel>
                <request-panel></request-panel>
            </z-splitter-panel>
        </z-splitter>
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
