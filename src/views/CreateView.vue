<script setup lang="ts">
import { reactive } from 'vue'
import { t } from '@/lang/i18n'
import { getQuantityUnitPairs } from '@/utils/ingredients_parsing'
import ButtonMulti from './components/ButtonMulti.vue'
import CheckIcon from './icons/IconCheck.vue'
import PreviewIcon from './icons/IconPreview.vue'
import { v7 as uuidv7 } from 'uuid'
import type { ParsedRecipe } from '@/types'

const data = reactive({
  name: '',
  tags: '',
  servings: undefined as number | undefined,
  ingredients: '',
  instructions: '',
  notes: '',
})

const validateServingsInput = (e: Event) => {
  const input = e.target as HTMLInputElement
  const value = input.value.trim()
  input.value = /^[1-9]{1,3}$/g.test(value) ? value : ''
}

const fitTextareaHeight = (e: Event) => {
  const textarea = e.target as HTMLTextAreaElement
  textarea.style.height = 'auto'
  textarea.style.height = `${textarea.scrollHeight}px`
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
  console.log(getQuantityUnitPairs(data.ingredients))
}
</script>

<template>
  <h2 class="heading--root">{{ t('Create recipe') }}</h2>
  <form class="create" @submit.prevent>
    <label for="create__name-input" class="heading--muted">{{ t('Name') }}</label>
    <input type="text" id="create__name-input" required v-model.trim="data.name" />
    <label for="create__tags-input" class="heading--muted">
      {{ t('Tags') }} {{ t('create.tags_hint') }}
    </label>
    <input type="text" id="create__tags-input" v-model.trim="data.tags" />
    <div class="servings">
      <label for="create__servings-input" class="heading--muted">{{ t('Servings') }}</label>
      <input type="number" id="create__servings-input" max="999" placeholder="1" v-model="data.servings"
        @input="validateServingsInput" />
    </div>
    <label for="create__ingredients-input" class="heading--muted" id="create__ingredients-heading">
      {{ t('Ingredients') }} {{ t('create.ingredients_hint') }}
    </label>
    <textarea id="create__ingredients-input" rows="3" v-model="data.ingredients" @input="fitTextareaHeight"></textarea>
    <label for="create__instructions-input" class="heading--muted">{{ t('Instructions') }}</label>
    <textarea id="create__instructions-input" rows="3" v-model="data.instructions"
      @input="fitTextareaHeight"></textarea>
    <label for="create__notes-input" class="heading--muted">{{ t('Notes') }}</label>
    <textarea id="create__notes-input" rows="2" v-model="data.notes" @input="fitTextareaHeight"></textarea>
    <ButtonMulti :icon="PreviewIcon" :desc="t('Preview')" showDesc @click="onCreate" />
  </form>
</template>

<style scoped>
input,
textarea {
  width: 100%;
  border-radius: var(--border-radius);
  background-color: var(--bg-light);
  border: none;
}

textarea {
  resize: none;
}

textarea.create__ingredients {
  font-family: var(--font-monospace);
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

/* Hide input controls */
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
