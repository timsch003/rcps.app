<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useRecipesStore } from '@/stores/recipes'
import CardsGrid from '@/views/components/CardsGrid.vue'

const router = useRouter()
const recipesStore = useRecipesStore()

const recipes = computed(() =>
  recipesStore.getAllWithTag(router.currentRoute.value.params.tagId as string),
)
</script>

<template>
  <CardsGrid :recipes="recipes" />
</template>

<style scoped></style>
