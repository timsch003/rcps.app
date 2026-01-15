<script setup lang="ts">
import { reactive } from 'vue'
import { t } from '@/lang/i18n'
import { parseIngredients } from '@/utils/ingredients_parsing'
import ButtonMulti from './components/ButtonMulti.vue'
import CheckIcon from './icons/IconCheck.vue'
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
  const recipe: ParsedRecipe = {
    id: uuidv7(),
    name: data.name,
    tags: data.tags
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0),
    servings: data.servings === undefined ? 1 : data.servings,
    ingredients: parseIngredients(data.ingredients),
  }
  console.log(recipe)
}
</script>

<template>
  <h2 class="heading--root">{{ t('Create recipe') }}</h2>
  <form class="create" @submit.prevent>
    <h3 class="heading--muted" id="create__name-heading">{{ t('Name') }}</h3>
    <input type="text" id="create__name-input" aria-labelledby="create__name-heading" required
      v-model.trim="data.name" />
    <h3 class="heading--muted" id="create__tags-heading">
      {{ t('Tags') }} {{ t('create.tags_hint') }}
    </h3>
    <input type="text" id="create__tags-input" aria-labelledby="create__tags-heading" v-model.trim="data.tags" />
    <div class="servings">
      <h3 class="heading--muted" id="create__servings-heading">{{ t('Servings') }}</h3>
      <input type="number" aria-labelledby="create__servings-heading" max="999" placeholder="1" v-model="data.servings"
        @input="validateServingsInput" />
    </div>
    <h3 class="heading--muted" id="create__ingredients-heading">
      {{ t('Ingredients') }} {{ t('create.ingredients_hint') }}
    </h3>
    <textarea aria-labelledby="create__ingredients-heading" id="create__ingredients-input" rows="3"
      v-model="data.ingredients" @input="fitTextareaHeight"></textarea>
    <h3 class="heading--muted" id="create__instructions-heading">{{ t('Instructions') }}</h3>
    <textarea aria-labelledby="create__instructions-heading" rows="3" v-model="data.instructions"
      @input="fitTextareaHeight"></textarea>
    <h3 class="heading--muted" id="create__notes-heading">{{ t('Notes') }}</h3>
    <textarea aria-labelledby="create__notes-heading" rows="2" v-model="data.notes"
      @input="fitTextareaHeight"></textarea>
    <ButtonMulti :icon="CheckIcon" :desc="t('Create recipe')" showDesc @click="onCreate" />
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
