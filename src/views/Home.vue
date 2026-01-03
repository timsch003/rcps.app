<script setup>
import Cards from "../Components/Cards.vue";

defineProps({
    tags: Array,
});
</script>

<template>
    <Cards :data="tags" :isTopLevel="true" />
</template>
