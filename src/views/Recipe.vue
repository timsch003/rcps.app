<script setup>
import Breadcrumbs from "../Components/Breadcrumbs.vue";

const props = defineProps({
    recipe: Array,
    tags: Object,
});
</script>

<template>
    <Breadcrumbs :origin="tags" :recipe="recipe.name" isSingleRecipe />
</template>

<style scoped></style>
