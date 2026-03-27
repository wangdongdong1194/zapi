<script setup lang="ts">
import vueLogo from '../assets/vue.svg'
    import FunctionPanel from '../components/FunctionPanel.vue';
    const icons = [
        {
            src: vueLogo,
            title: 'Vue',
            selected: true
        },
        {
            src: vueLogo,
            title: 'Vue'
        }
    ];
</script>

<template>
    <div class="splitter-wrapper">
        <el-splitter>
            <el-splitter-panel size="60px" min="60px" max="60px">
                <function-panel :icons="icons"></function-panel>
            </el-splitter-panel>
            <el-splitter-panel size="200px">
                <div class="item-panel">1</div>
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
