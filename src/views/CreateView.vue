<script setup lang="ts">
import { ref, reactive } from 'vue'
import PreviewQuickCorrect from '@/views/components/PreviewQuickCorrect.vue'
import ButtonMulti from '@/views/components/ButtonMulti.vue'
import { t } from '@/lang/i18n'
import { matchIngredients } from '@/utils/parsing'
import PreviewIcon from '@/views/icons/IconPreview.vue'
import type { RawRecipe } from '@/types'

const data = reactive<RawRecipe>({
  name: '',
  tags: '',
  servings: undefined,
  ingredients: '',
  matchedIngredients: [],
  instructions: '',
  notes: '',
})
const previewing = ref(false)

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

const resetTextareaHeight = (e: Event) => {
  const textarea = e.target as HTMLTextAreaElement
  textarea.style.height = 'auto'
}

async function onPreview() {
  data.name = data.name.trim()

  data.tags = data.tags
    .split(',')
    .map((tag) => tag.trim())
    .join(', ')

  data.servings = data.servings === undefined ? 1 : Number(data.servings)

  data.ingredients = data.ingredients.trim()
  if (data.ingredients) data.matchedIngredients = matchIngredients(data.ingredients)

  data.instructions = data.instructions.trim()
  data.notes = data.notes.trim()

  scrollTo(0, 0)

  previewing.value = true
}
</script>

<template>
  <div v-if="!previewing">
    <h2 class="heading--root">{{ t('Create recipe') }}</h2>
    <form class="create" @submit.prevent>
      <label for="create__name-input" class="heading--muted">{{ t('Name') }}</label>
      <input type="text" id="create__name-input" v-model.trim="data.name" />
      <label for="create__tags-input" class="heading--muted">
        {{ t('Tags') }} {{ t('create.tags_hint') }}
      </label>
      <input type="text" id="create__tags-input" v-model.trim="data.tags" />
      <div class="servings">
        <label for="create__servings-input" class="heading--muted">{{ t('Servings') }}</label>
        <input
          type="number"
          id="create__servings-input"
          placeholder="1"
          v-model="data.servings"
          @input="validateServingsInput"
        />
      </div>
      <label
        for="create__ingredients-input"
        class="heading--muted"
        id="create__ingredients-heading"
      >
        {{ t('Ingredients') }} {{ t('create.ingredients_hint') }}
      </label>
      <textarea
        id="create__ingredients-input"
        v-model="data.ingredients"
        @focus="fitTextareaHeight"
        @blur="resetTextareaHeight"
        @input="fitTextareaHeight"
      ></textarea>
      <label for="create__instructions-input" class="heading--muted">{{ t('Instructions') }}</label>
      <textarea
        id="create__instructions-input"
        v-model="data.instructions"
        @focus="fitTextareaHeight"
        @blur="resetTextareaHeight"
        @input="fitTextareaHeight"
      ></textarea>
      <label for="create__notes-input" class="heading--muted">{{ t('Notes') }}</label>
      <textarea
        id="create__notes-input"
        v-model="data.notes"
        @focus="fitTextareaHeight"
        @blur="resetTextareaHeight"
        @input="fitTextareaHeight"
      ></textarea>
      <ButtonMulti :icon="PreviewIcon" :desc="t('Preview')" showDesc @click="onPreview" />
    </form>
  </div>
  <PreviewQuickCorrect v-else v-model:data="data" v-model:previewing="previewing" />
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

textarea#create__ingredients-input {
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
