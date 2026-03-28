<script setup lang="ts">
    defineProps<{
        size?: string | number;
        min?: string | number;
        max?: string | number;
    }>();
</script>

<template>
    <div class="z-splitter-panel">
        <slot />
    </div>
</template>

<style scoped>
    .z-splitter-panel {
        width: 100%;
        height: 100%;
        overflow: auto;
    }
</style>
