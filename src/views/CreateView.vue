<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useRecipeIngredientsStore } from '@/stores/recipe_ingredients'
import { useRecipesStore } from '@/stores/recipes'
import { useUnitsStore } from '@/stores/units'
import { t } from '@/lang/i18n'
import ButtonMulti from './components/ButtonMulti.vue'
import CheckIcon from './icons/IconCheck.vue'

const route = useRoute()
const recipeIngredientsStore = useRecipeIngredientsStore()
const recipesStore = useRecipesStore()
const unitsStore = useUnitsStore()

async function onCreate() {
  // TODO
}
</script>

<template>
  <form class="create" @submit.prevent>
    <h3 class="heading--muted" id="name-heading">{{ t('Name') }}</h3>
    <input type="text" autofocus="true" aria-labelledby="name-heading" required />
    <h3 class="heading--muted" id="tags-heading">{{ t('Tags') }}</h3>
    <input type="text" aria-labelledby="tags-heading" required />
    <div class="servings">
      <h3 class="heading--muted" id="servings-heading">{{ t('Servings') }}</h3>
      <input type="number" aria-labelledby="servings-heading" />
    </div>
    <h3 class="heading--muted" id="ingredients-heading">{{ t('Ingredients') }}</h3>
    <textarea aria-labelledby="ingredients-heading"></textarea>
    <h3 class="heading--muted" id="instructions-heading">{{ t('Instructions') }}</h3>
    <textarea aria-labelledby="instructions-heading"></textarea>
    <h3 class="heading--muted" id="notes-heading">{{ t('Notes') }}</h3>
    <textarea aria-labelledby="notes-heading"></textarea>
    <ButtonMulti :icon="CheckIcon" :desc="t('Create')" showDesc @click="onCreate" />
  </form>
</template>

<style scoped>
div.servings {

  h3,
  input {
    display: inline-block;
    max-width: max-content;
  }

  h3 {
    margin-right: var(--gap);
  }

  input {
    width: 50px;
  }
}
</style>
