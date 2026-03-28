<script setup lang="ts">
    defineProps<{
        label: string;
        name: string | number;
        closable?: boolean;
        disabled?: boolean;
    }>();
</script>

<template>
    <div class="z-tab-pane">
        <slot />
    </div>
</template>

<style scoped>
    .z-tab-pane {
        width: 100%;
        height: 100%;
    }
</style>
