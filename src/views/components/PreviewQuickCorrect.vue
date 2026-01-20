<script lang="ts" setup>
import { ref } from 'vue'
import { t } from '@/lang/i18n'
import CheckIcon from '@/views/icons/IconCheck.vue'
import IconArrowLeft from '../icons/IconArrowLeft.vue'
import ButtonMulti from './ButtonMulti.vue'
import type { RawRecipe } from '@/types'

const data = defineModel<RawRecipe>('data')
const previewing = defineModel<boolean>('previewing')
const deselectedIngredientQuantities = ref<{ ingredientIndex: number; partIndex: number }[]>([])

console.log(data)

function toggleQuantity(e: Event, ingredientIndex: number, partIndex: number) {
  const span = e.target as HTMLSpanElement
  span.classList.toggle('preview__ingredient-quantity--selected')

  if (!span.classList.contains('preview__ingredient-quantity--selected')) {
    deselectedIngredientQuantities.value.push({ ingredientIndex, partIndex })
  } else {
    deselectedIngredientQuantities.value = deselectedIngredientQuantities.value.filter(
      (d) => d.ingredientIndex !== ingredientIndex || d.partIndex !== partIndex,
    )
  }

  console.log(deselectedIngredientQuantities)
}

async function onCreate() {
  // const recipe: ParsedRecipe = {
  //   id: uuidv7(),
  //   name: data.name,
  //   tags: data.tags
  //     .split(',')
  //     .map((tag) => tag.trim())
  //     .filter((tag) => tag.length > 0),
  //   servings: data.servings === undefined ? 1 : data.servings,
  //   ingredients: parseIngredients(data.ingredients),
  // }
  // console.log(recipe)
}
</script>

<template>
  <ButtonMulti :icon="IconArrowLeft" :desc="t('Back to editing')" showDesc @click="previewing = false" />
  <div class="preview">
    <h2 class="heading--root">{{ t('Preview & Quick-correct') }}</h2>
    <h3>{{ data?.name }}</h3>
    <p>Tags: {{ data?.tags ? data.tags : '-' }}</p>
    <p>Servings: {{ data?.servings }}</p>
    <h4>Ingredients</h4>
    <ul>
      <li v-for="(ing, index) in data?.matchedIngredients" :key="index">
        <span v-if="ing.parts!.length <= 0">{{ ing.trimmedLine }}</span>
        <span v-else v-for="(part, partIndex) in ing.parts" :key="partIndex">
          <span v-if="part.quantity" class="preview__ingredient-quantity preview__ingredient-quantity--selected"
            @click="toggleQuantity($event, index, partIndex)">
            {{ part.quantity }}</span>
          <span v-if="part.knownUnit">{{ part.knownUnit }}</span>
          <span v-if="part.text">{{ part.text }}</span>
        </span>
      </li>
    </ul>
    <p>{{ data?.instructions }}</p>
    <p>{{ data?.notes }}</p>
  </div>
  <ButtonMulti :icon="CheckIcon" :desc="t('Create Recipe')" showDesc @click="onCreate" />
</template>

<style scoped>
div.preview {
  margin-top: calc(var(--inner-spacing) * 1.5);
  margin-bottom: calc(var(--inner-spacing) * 2);
}

li {
  line-height: 1.75;
  padding-block: 4px;
  border-bottom: 1px solid var(--bg-lighter);
}

li:first-child {
  border-top: 1px solid var(--bg-lighter);
}

span.preview__ingredient-quantity,
span.preview__ingredient-quantity--selected {
  font-weight: 600;
  padding-inline: 2px;
  cursor: pointer;
  border-radius: var(--border-radius);
}

span.preview__ingredient-quantity {
  border: 2px solid transparent;
}

span.preview__ingredient-quantity--selected {
  border: 2px solid var(--accent);
}
</style>
