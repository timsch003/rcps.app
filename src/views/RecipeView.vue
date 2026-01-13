<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useRecipesStore } from '@/stores/recipes'
import { t } from '@/lang/i18n'

const route = useRoute()
const recipesStore = useRecipesStore()

const data = computed(() => {
  return recipesStore.get(route.params.id as string)
})

console.log(data)
</script>

<template>
  <h2>{{ data?.name }}</h2>
  <h3>{{ t('Ingredients') }}</h3>
  <ul>
    <li v-for="(ingredient, index) in data?.recipeIngredientIds" :key="index">
      {{ ingredient }}
    </li>
  </ul>
</template>

<style scoped></style>
