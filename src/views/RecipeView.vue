<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useRecipesStore } from '@/stores/recipes'
import { useTagsStore } from '@/stores/tags'
import { useRecipeIngredientsStore } from '@/stores/recipe_ingredients'
import { useUnitsStore } from '@/stores/units'
import { t } from '@/lang/i18n'
import ButtonMulti from './components/ButtonMulti.vue'

const route = useRoute()
const recipesStore = useRecipesStore()
const tagsStore = useTagsStore()
const recipeIngredientsStore = useRecipeIngredientsStore()
const unitsStore = useUnitsStore()

const recipe = recipesStore.get(route.params.id as string)
const ingredients = recipeIngredientsStore.getIngredientsByRecipeId(route.params.id as string)
const tags = tagsStore.getNames(recipe?.tagIds || [])

function onServingsDecrease() {
  // TODO
}

function onServingsIncrease() {
  // TODO
}
</script>

<template>
  <h2 class="heading--root">{{ recipe?.name }}</h2>

  <div v-if="recipe?.servings" class="servings">
    <h3>{{ `${t('Servings')}: ${recipe?.servings}` }}</h3>
    <ButtonMulti desc="-" showDesc :aria-label="t('Decrease')" @click="onServingsDecrease" />
    <ButtonMulti desc="+" showDesc :aria-label="t('Increase')" @click="onServingsIncrease" />
  </div>

  <h3 class="heading--muted">{{ t('Tags') }}</h3>
  <p>
    <span v-if="!tags.length">{{ '-' }}</span>
    <span v-else v-for="(tag, index) in tags" :key="index"
      >{{ tag }}{{ index < tags.length - 1 ? ', ' : '' }}</span
    >
  </p>

  <h3 v-if="ingredients?.length" class="heading--muted">{{ t('Ingredients') }}</h3>
  <ul v-if="ingredients?.length">
    <li v-for="ingredient in ingredients" :key="ingredient?.id">
      <span v-if="ingredient?.quantity">{{ ingredient.quantity }}&nbsp;</span>
      <span v-if="ingredient?.unitId">{{ unitsStore.getName(ingredient.unitId) }}&nbsp;</span>
      <span>{{ ingredient?.name }}&nbsp;</span>
    </li>
  </ul>
  <h3 v-if="recipe?.instructions" class="heading--muted">{{ t('Instructions') }}</h3>
  <p v-if="recipe?.instructions">{{ recipe?.instructions }}</p>
  <h3 v-if="recipe?.notes" class="heading--muted">{{ t('Notes') }}</h3>
  <p v-if="recipe?.notes">{{ recipe?.notes }}</p>
</template>

<style scoped>
h3:not(:first-of-type) {
  margin-top: var(--inner-spacing);
}

div.servings {
  display: flex;
  align-items: center;
  gap: var(--gap);

  h3 {
    font-size: 0.9rem;
  }
}
</style>
