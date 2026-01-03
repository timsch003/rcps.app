<script setup>
import Breadcrumbs from "../Components/Breadcrumbs.vue";
import Cards from "../Components/Cards.vue";

const props = defineProps({
    recipes: Array,
    tag: Object,
});
</script>

<template>
    <Breadcrumbs :origin="tag" />
    <Cards :data="recipes" />
</template>

<style scoped></style>
