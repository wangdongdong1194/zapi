<script setup lang="ts">
    import { IFunctionPanelProps } from '../types/type';
    import IconComponent from './base/IconComponent.vue';

    const props = defineProps<IFunctionPanelProps>();
</script>
<template>
    <div class="iconComponent">
        <IconComponent v-for="(item, index) in props.icons" :key="index" :src="item.src" :title="item.title"
            :selected="item.selected"></IconComponent>
    </div>
</template>
<style scoped>
    .iconComponent {
        padding: 5px;
    }
</style>