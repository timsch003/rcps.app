<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useRecipeIngredientsStore } from '@/stores/recipe_ingredients'
import { useRecipesStore } from '@/stores/recipes'
import { useUnitsStore } from '@/stores/units'
import { t } from '@/lang/i18n'

const route = useRoute()
const recipeIngredientsStore = useRecipeIngredientsStore()
const recipesStore = useRecipesStore()
const unitsStore = useUnitsStore()

const recipe = recipesStore.get(route.params.id as string)
const ingredients = recipeIngredientsStore.getIngredientsByRecipeId(route.params.id as string)
console.log(ingredients)
</script>

<template>
  <h2>{{ recipe?.name }}</h2>
  <h3 v-if="ingredients">{{ t('Ingredients') }}</h3>
  <ul v-if="ingredients">
    <li v-for="ingredient in ingredients" :key="ingredient?.id">
      <span v-if="ingredient?.quantity">{{ ingredient.quantity }} &nbsp;</span>
      <span v-if="ingredient?.unitId">{{ unitsStore.getName(ingredient.unitId) }} &nbsp;</span>
      <span>{{ ingredient?.name }}&nbsp;</span>
      <span v-if="ingredient?.notes">({{ ingredient.notes }})</span>
    </li>
  </ul>
  <h3 v-if="recipe?.instructions">{{ t('Instructions') }}</h3>
  <p v-if="recipe?.instructions">{{ recipe?.instructions }}</p>
  <h3 v-if="recipe?.notes">{{ t('Notes') }}</h3>
  <p v-if="recipe?.notes">{{ recipe?.notes }}</p>
</template>

<style scoped></style>
