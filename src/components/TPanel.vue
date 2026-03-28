<template>
    <z-tabs v-model="active" closable @tab-remove="onRemove">
        <z-tab-pane v-for="item in tabs" :key="item.name" :label="item.label" :name="item.name">
            {{ item.content }}
        </z-tab-pane>
    </z-tabs>
</template>

<script setup lang="ts">
    import { ref } from "vue";

    const active = ref("1");
    const tabs = ref([
        { name: "1", label: "Tab 1", content: "Content 1" },
        { name: "2", label: "Tab 2", content: "Content 2" },
        { name: "3", label: "Tab 3", content: "Content 3" },
        { name: "4", label: "Tab 4", content: "Content 1" },
        { name: "5", label: "Tab 5", content: "Content 2" },
        { name: "6", label: "Tab 6", content: "Content 3" },
        { name: "7", label: "Tab 7", content: "Content 1" },
        { name: "8", label: "Tab 8", content: "Content 2" },
        { name: "9", label: "Tab 9", content: "Content 3" },
        { name: "10", label: "Tab 10", content: "Content 1" },
        { name: "11", label: "Tab 11", content: "Content 2" },
        { name: "12", label: "Tab 12", content: "Content 3" },
    ]);

    const onRemove = (name: string | number) => {
        tabs.value = tabs.value.filter((t) => t.name !== name);
        if (active.value === name && tabs.value.length) {
            active.value = String(tabs.value[0].name);
        }
    };
</script>