<script setup lang="ts">
    import { IIconComponentProps } from '../../types/type';

    const props = defineProps<IIconComponentProps>();
</script>
<template>
    <img :src="props.src" :class="['img', { selected: props.selected }]" :title="props.title" />
</template>
<style scoped>
    .img {
        width: 100%;
        padding: 5px;
        background: green;
        cursor: pointer;
        border-radius: 10px;
    }

    .img:hover {
        background: peru;
    }

    .img:active {
        background: purple;
    }

    .selected {
        background: greenyellow;
    }
</style>