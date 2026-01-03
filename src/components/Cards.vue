<script setup>
import Card from "../Components/Card.vue";

const props = defineProps({
    data: Array,
    isTopLevel: {
        type: Boolean,
        default: false,
    },
});
</script>

<template>
    <div>
        <Card v-for="d in data" :key="d.id" :data="d" :isTopLevel="isTopLevel" />
    </div>
</template>

<style scoped>
div {
    --min-card-width: 160px;

    display: grid;
    gap: var(--gap);
    grid-template-columns: repeat(auto-fill,
            minmax(min(var(--min-card-width), 100%), 1fr));
}
</style>
