<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import CheckAndCorrect from '@/views/components/CheckAndCorrect.vue'
import ButtonMulti from '@/views/components/ButtonMulti.vue'
import { t } from '@/lang/i18n'
import { recipesManager } from '@/services/recipes_manager'
import { ingredientsManager } from '@/services/ingredients_manager'
import PreviewIcon from '@/views/icons/IconPreview.vue'
import type { RecipeRaw } from '@/types'
import { sync } from '@/services/sync'

onMounted(async () => {
  const pushedChanges = await sync.pushLocalChanges()
  console.log(pushedChanges)
})

const data = reactive<RecipeRaw>({
  name: '',
  tags: [],
  servings: undefined,
  ingredients: '',
  matchedIngredients: [],
  instructions: '',
  notes: '',
})
const checking = ref(false)

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
  if (!data.name) {
    alert(t('create.alert_name_required'))
    return
  } else if (await recipesManager.nameExists(data.name)) {
    alert(t('create.alert_name_exists'))
    return
  }

  data.servings = data.servings ? data.servings : 1

  data.tags = Array.isArray(data.tags)
    ? data.tags
    : data.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag !== '')

  if (data.ingredients) data.matchedIngredients = ingredientsManager.match(data.ingredients)

  checking.value = true

  scrollTo(0, 0)
}
</script>

<template>
  <div v-if="!checking">
    <h2 class="heading--root">{{ t('Create recipe') }}</h2>

    <form class="create" @submit.prevent>
      <label for="create__name-input" class="heading--muted">{{ t('Name') }}</label>
      <input type="text" id="create__name-input" v-model.trim="data.name" />

      <div class="servings">
        <label for="create__servings-input" class="heading--muted">{{ t('Servings') }}</label>
        <input
          type="number"
          id="create__servings-input"
          placeholder="1"
          v-model.number="data.servings"
          @input="validateServingsInput"
        />
      </div>

      <label for="create__tags-input" class="heading--muted">
        {{ t('Tags') }} {{ t('create.tags_hint') }}
      </label>
      <input type="text" id="create__tags-input" v-model="data.tags" />

      <label
        for="create__ingredients-input"
        class="heading--muted"
        id="create__ingredients-heading"
      >
        {{ t('Ingredients') }} {{ t('create.ingredients_hint') }}
      </label>
      <textarea
        id="create__ingredients-input"
        v-model.trim="data.ingredients"
        @focus="fitTextareaHeight"
        @blur="resetTextareaHeight"
        @input="fitTextareaHeight"
      ></textarea>

      <label for="create__instructions-input" class="heading--muted">{{ t('Instructions') }}</label>
      <textarea
        id="create__instructions-input"
        v-model.trim="data.instructions"
        @focus="fitTextareaHeight"
        @blur="resetTextareaHeight"
        @input="fitTextareaHeight"
      ></textarea>

      <label for="create__notes-input" class="heading--muted">{{ t('Notes') }}</label>
      <textarea
        id="create__notes-input"
        v-model.trim="data.notes"
        @focus="fitTextareaHeight"
        @blur="resetTextareaHeight"
        @input="fitTextareaHeight"
      ></textarea>

      <ButtonMulti :icon="PreviewIcon" :desc="t('Check & correct')" showDesc @click="onPreview" />
    </form>
  </div>
  <CheckAndCorrect v-else v-model:data="data" v-model:checking="checking" />
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
