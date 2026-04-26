<script setup lang="ts">
import { ref, reactive } from 'vue'
import CheckAndCorrect from '@/views/components/CheckAndCorrect.vue'
import ButtonMulti from '@/views/components/ButtonMulti.vue'
import { t } from '@/lang/i18n'
import { recipesManager } from '@/services/recipes_manager'
import { ingredientsManager } from '@/services/ingredients_manager'
import PreviewIcon from '@/views/icons/IconPreview.vue'
import type { RecipeRaw } from '@/types'
import { useRoute } from 'vue-router'
import { tagsManager } from '@/services/tags_manager'
import { onMounted } from 'vue'
import type { RecipeLocal } from '@/types'

const data = reactive<RecipeRaw>({
  name: '',
  tags: [],
  favorite: false,
  servings: undefined,
  ingredients: '',
  matchedIngredients: [],
  instructions: '',
  notes: '',
})
const checking = ref(false)
const route = useRoute()
const editingRecipeId = ref<RecipeLocal['id'] | null>(null)
const loading = ref(false)

onMounted(async () => {
  const recipeId = route.query.edit as string | undefined
  if (recipeId) {
    loading.value = true
    try {
      const recipe = await recipesManager.getById(recipeId)
      if (recipe) {
        editingRecipeId.value = recipe.id
        data.name = recipe.name
        data.favorite = recipe.favorite
        data.servings = recipe.servings
        data.instructions = recipe.instructions || ''
        data.notes = recipe.notes || ''

        if (recipe.tagIds?.length) {
          const tagNames = await tagsManager.getNames(recipe.tagIds)
          data.tags = tagNames
        }

        if (recipe.recipeIngredientIds?.length) {
          const recipeIngredients = await ingredientsManager.getRecipeIngredients(
            recipe.recipeIngredientIds,
          )
          const ingStrings = await Promise.all(
            recipeIngredients.map(async (ri) => {
              return await recipesManager.getIngStrings(ri)
            }),
          )
          data.ingredients = ingStrings
            .filter((strings) => strings && strings.length > 0)
            .map((strings) => (strings ? strings.join('') : ''))
            .join('\n')
        }
      }
    } catch (err) {
      console.error('Failed to load recipe for editing:', err)
    } finally {
      loading.value = false
    }
  }
})

const validateServingsInput = (e: Event) => {
  const input = e.target as HTMLInputElement
  const value = input.value.trim()
  input.value = /^[1-9]{1,3}$/g.test(value) ? value : ''
}

const fitTextareaHeight = (e: Event) => {
  const textarea = e.target as HTMLTextAreaElement
  textarea.style.height = `${textarea.scrollHeight}px`
}

const resetTextareaHeight = (e: Event) => {
  const textarea = e.target as HTMLTextAreaElement
  textarea.style.height = 'auto'
}

async function onPreview() {
  if (!data.name) {
    alert(t('create_edit.alert_name_required'))
    return
  }
  if (editingRecipeId.value) {
    // When editing, check name uniqueness excluding current recipe
    if (await recipesManager.nameExistsExcluding(data.name, editingRecipeId.value)) {
      alert(t('create_edit.alert_name_exists'))
      return
    }
  } else {
    // When creating, check if name already exists
    if (await recipesManager.nameExists(data.name)) {
      alert(t('create_edit.alert_name_exists'))
      return
    }
  }

  if (!data.tags.length || (typeof data.tags === 'string' && !data.tags.trim())) {
    alert(t('create_edit.alert_tags_required'))
    return
  }

  data.servings = data.servings ? data.servings : 1

  data.tags = Array.isArray(data.tags)
    ? data.tags
    : data.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag !== '')

  if (data.ingredients)
    data.matchedIngredients = ingredientsManager.matchAndNormalize(data.ingredients)

  checking.value = true

  scrollTo(0, 0)
}
</script>

<template>
  <Transition name="slide-in-rtl">
    <div v-if="!checking" key="create-form">
      <h2 v-if="editingRecipeId" class="heading--root">{{ t('Edit recipe') }}</h2>
      <h2 v-else class="heading--root">{{ t('Create recipe') }}</h2>

      <p v-if="loading" class="loading">{{ t('sync.status_pulling') }}</p>

      <form class="create" @submit.prevent v-if="!loading">
        <label for="create__name-input" class="heading--muted">{{ t('Name') }}</label>
        <input type="text" id="create__name-input" v-model.trim="data.name" />

        <div class="create__servings">
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
          {{ t('Tags') }} {{ t('tags_hint') }}
        </label>
        <input type="text" id="create__tags-input" v-model="data.tags" />

        <label for="create__favorite-input" class="heading--muted">{{
          t('create_edit.favorite')
        }}</label>
        <input type="checkbox" id="create__favorite-input" v-model="data.favorite" />

        <label
          for="create__ingredients-input"
          class="heading--muted"
          id="create__ingredients-heading"
        >
          {{ t('Ingredients') }} {{ t('create_edit.ingredients_hint') }}
        </label>
        <textarea
          id="create__ingredients-input"
          v-model.trim="data.ingredients"
          @focus="fitTextareaHeight"
          @blur="resetTextareaHeight"
          @input="fitTextareaHeight"
        ></textarea>

        <label for="create__instructions-input" class="heading--muted">{{
          t('Instructions')
        }}</label>
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
    <CheckAndCorrect
      v-else
      v-model:data="data"
      v-model:checking="checking"
      :editing-recipe-id="editingRecipeId"
      key="check-correct"
    />
  </Transition>
</template>

<style scoped>
input:not([type='checkbox']),
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

.create__servings input {
  width: 3em;
  text-align: center;
}

h3,
input {
  display: inline-block;
  max-width: max-content;
}
</style>
