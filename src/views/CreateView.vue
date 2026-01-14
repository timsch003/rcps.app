<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { useRecipeIngredientsStore } from '@/stores/recipe_ingredients'
import { useRecipesStore } from '@/stores/recipes'
import { useUnitsStore } from '@/stores/units'
import { t } from '@/lang/i18n'
import type { ParsedIngredient } from '@/types'
import ButtonMulti from './components/ButtonMulti.vue'
import CheckIcon from './icons/IconCheck.vue'

const route = useRoute()
const recipeIngredientsStore = useRecipeIngredientsStore()
const recipesStore = useRecipesStore()
const unitsStore = useUnitsStore()

const servings = ref<number | undefined>(undefined)

const onServingsInput = (e: Event) => {
  const input = e.target as HTMLInputElement
  const value = input.value.trim()
  input.value = /^[1-9]{1,3}$/g.test(value) ? value : ''
}

function parseIngredientLine(line: string): ParsedIngredient | null {
  const trimmed = line.trim()
  if (!trimmed) return null

  // Match: [optional number] [optional unit] [name] [optional (notes)]
  const regex = /^(?:(\d+(?:\.\d+)?)\s+)?(?:(\w+)\s+)?(.+?)(?:\s+\((.+)\))?$/
  const match = trimmed.match(regex)

  if (!match) return null

  const [, quantityStr, unit, name, notes] = match

  return {
    quantity: quantityStr ? parseFloat(quantityStr) : undefined,
    unit: unit || undefined,
    name: name?.trim() || '',
    notes: notes || undefined,
  }
}

function parseIngredients(text: string): ParsedIngredient[] {
  return text
    .split('\n')
    .map(parseIngredientLine)
    .filter((ing): ing is ParsedIngredient => ing !== null)
}

async function onCreate() {
  const ingredientsText = (document.getElementById('ingredients') as HTMLTextAreaElement).value
  console.log(parseIngredients(ingredientsText))
}
</script>

<template>
  <form class="create" @submit.prevent>
    <h3 class="heading--muted" id="name-heading">{{ t('Name') }}</h3>
    <input type="text" autofocus="true" aria-labelledby="name-heading" required />
    <h3 class="heading--muted" id="tags-heading">{{ t('Tags') }}</h3>
    <input type="text" autofocus="true" aria-labelledby="tags-heading" />
    <div class="servings">
      <h3 class="heading--muted" id="servings-heading">{{ t('Servings') }}</h3>
      <input type="number" aria-labelledby="servings-heading" max="999" :value="servings" @input="onServingsInput" />
    </div>
    <h3 class="heading--muted" id="ingredients-heading">{{ t('Ingredients') }}</h3>
    <textarea aria-labelledby="ingredients-heading" id="ingredients"></textarea>
    <h3 class="heading--muted" id="instructions-heading">{{ t('Instructions') }}</h3>
    <textarea aria-labelledby="instructions-heading"></textarea>
    <h3 class="heading--muted" id="notes-heading">{{ t('Notes') }}</h3>
    <textarea aria-labelledby="notes-heading"></textarea>
    <ButtonMulti :icon="CheckIcon" :desc="t('Create')" showDesc @click="onCreate" />
  </form>
</template>

<style scoped>
input,
textarea {
  width: 100%;
}

textarea {
  min-height: 240px;
  resize: vertical;
  border-left: 1px solid var(--decor);
  border-bottom: 1px solid var(--decor);
  white-space: nowrap;
  overflow-x: auto;
}

div.servings {
  h3 {
    margin-right: var(--gap);
  }

  input {
    width: 3em;
    text-align: center;
  }

  h3,
  input {
    display: inline-block;
    max-width: max-content;
  }
}

/* Hide number input controls */
input[type='number'] {
  max-width: max-content;
}

input[type='number'] {
  -webkit-appearance: textfield;
  -moz-appearance: textfield;
  appearance: textfield;
}

input[type='number']::-webkit-inner-spin-button,
input[type='number']::-webkit-outer-spin-button {
  -webkit-appearance: none;
}
</style>
