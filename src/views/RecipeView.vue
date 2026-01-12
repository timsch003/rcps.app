<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useRecipesStore } from '@/stores/recipes'

const route = useRoute()
const recipesStore = useRecipesStore()

const data = computed(() => {
  return recipesStore.get(route.params.id as string)
})
</script>

<template>
  <h2>{{ data?.name }}</h2>
</template>

<style scoped></style>
