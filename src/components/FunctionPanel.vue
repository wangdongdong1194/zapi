<script setup lang="ts">
    import { ref } from 'vue';
    import IconComponent from './base/IconComponent.vue';
    import vueLogo from '../assets/vue.svg'
    import { IIconComponentProps } from '../types/type';

    // const props = defineProps<IFunctionPanelProps>();
    const icons = ref<IIconComponentProps[]>([
        {
            src: vueLogo,
            title: 'GitHub',
            selected: true,
        },
        {
            src: vueLogo,
            title: 'GitLab',
            selected: false,
        },
        {
            src: vueLogo,
            title: 'Bitbucket',
            selected: false,
        },
    ]);
</script>
<template>
    <div class="iconComponent">
        <IconComponent v-for="(item, index) in icons" :key="index" :src="item.src" :title="item.title"
            :selected="item.selected"></IconComponent>
    </div>
</template>
<style scoped>
    .iconComponent {
        padding: 5px;
    }
</style>