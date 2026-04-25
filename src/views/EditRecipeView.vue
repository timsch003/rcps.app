<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ButtonMulti from '@/views/components/ButtonMulti.vue'
import AddIcon from '@/views/icons/IconAdd.vue'
import CheckIcon from '@/views/icons/IconCheck.vue'
import CloseIcon from '@/views/icons/IconClose.vue'
import { t } from '@/lang/i18n'
import { recipesManager } from '@/services/recipes_manager'
import { ingredientsManager } from '@/services/ingredients_manager'
import { tagsManager } from '@/services/tags_manager'
import { unitsManager } from '@/services/units_manager'
import { useUnitsStore } from '@/stores/units'
import { dashes } from '@/utils/fixed_values'
import type { EditableRecipeIngredient, RecipeEdit, RecipeIngredient, RecipeLocal } from '@/types'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const saving = ref(false)
const error = ref<string | null>(null)
const recipe = ref<RecipeLocal | undefined>(undefined)
const form = reactive<RecipeEdit>({
  name: '',
  tags: '',
  favorite: false,
  servings: undefined,
  ingredients: [],
  instructions: '',
  notes: '',
})

const unitOptions = computed(() => {
  return [...useUnitsStore().cached]
    .map((unit) => unit.name)
    .sort((left, right) => left.localeCompare(right))
})

void loadRecipe()

async function loadRecipe() {
  loading.value = true
  error.value = null

  try {
    recipe.value = await recipesManager.getById(route.params.id as string)
    if (!recipe.value) throw new Error(t('error.recipe_not_found'))

    const tags = recipe.value.tagIds?.length ? tagsManager.getNames(recipe.value.tagIds) : []
    const ingredients = recipe.value.recipeIngredientIds?.length
      ? await ingredientsManager.getRecipeIngredients(recipe.value.recipeIngredientIds)
      : []

    form.name = recipe.value.name
    form.tags = tags.join(', ')
    form.favorite = recipe.value.favorite
    form.servings = recipe.value.servings
    form.ingredients = await Promise.all(
      ingredients.map((ingredient) => toEditableIngredient(ingredient)),
    )
    form.instructions = recipe.value.instructions || ''
    form.notes = recipe.value.notes || ''

    if (!form.ingredients.length) addIngredient()
  } catch (err) {
    error.value = (err as Error).message
  } finally {
    loading.value = false
  }
}

function addIngredient() {
  form.ingredients.push(createEmptyIngredient())
}

function removeIngredient(index: number) {
  form.ingredients.splice(index, 1)
  if (!form.ingredients.length) addIngredient()
}

function createEmptyIngredient(): EditableRecipeIngredient {
  return {
    textBefore: '',
    quantity: '',
    hasRange: false,
    quantityUpper: '',
    unit: '',
    textAfter: '',
  }
}

async function toEditableIngredient(
  recipeIngredient: RecipeIngredient,
): Promise<EditableRecipeIngredient> {
  const ingredientName = (await ingredientsManager.getName(recipeIngredient)) || ''
  const unit = recipeIngredient.unitId
    ? unitsManager.getNameById(recipeIngredient.unitId) || ''
    : ''

  if (
    recipeIngredient.quantity === undefined ||
    recipeIngredient.quantityUnitPosition === undefined
  ) {
    return {
      textBefore: ingredientName,
      quantity: '',
      hasRange: false,
      quantityUpper: '',
      unit: '',
      textAfter: '',
    }
  }

  const pivot = recipeIngredient.quantityUnitPosition
  return {
    textBefore: ingredientName.slice(0, pivot).trim(),
    quantity: String(recipeIngredient.quantity),
    hasRange: recipeIngredient.quantityUpper !== undefined,
    quantityUpper:
      recipeIngredient.quantityUpper !== undefined ? String(recipeIngredient.quantityUpper) : '',
    unit,
    textAfter: ingredientName.slice(pivot).trim(),
  }
}

function validateServingsInput(e: Event) {
  const input = e.target as HTMLInputElement
  const value = input.value.trim()
  input.value = /^[1-9]{1,3}$/g.test(value) ? value : ''
}

function validateIngredientQuantityInput(
  e: Event,
  ingredient: EditableRecipeIngredient,
  field: 'quantity' | 'quantityUpper',
) {
  const input = e.target as HTMLInputElement
  const value = input.value.trim()
  const isValid = /^$|^\d+(?:[.,]\d*)?$/.test(value)

  input.value = isValid ? value : ''
  ingredient[field] = input.value

  if (field === 'quantity' && ingredient.quantity === '') ingredient.quantityUpper = ''
}

function fitTextareaHeight(e: Event) {
  const textarea = e.target as HTMLTextAreaElement
  textarea.style.height = `${textarea.scrollHeight}px`
}

function resetTextareaHeight(e: Event) {
  const textarea = e.target as HTMLTextAreaElement
  textarea.style.height = 'auto'
}

function normalizeIngredients() {
  return form.ingredients.filter((ingredient) => {
    return Object.values(ingredient).some((value) => {
      if (typeof value === 'boolean') return value
      return value.trim() !== ''
    })
  })
}

async function onSave() {
  if (!recipe.value) return
  if (!form.name.trim()) {
    alert(t('create.alert_name_required'))
    return
  }
  if (await recipesManager.nameExistsExcluding(form.name.trim(), recipe.value.id)) {
    alert(t('create.alert_name_exists'))
    return
  }

  const normalizedTags =
    typeof form.tags === 'string'
      ? form.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter((tag) => tag !== '')
      : form.tags
  if (!normalizedTags.length) {
    alert(t('create.alert_tags_required'))
    return
  }

  const normalizedIngredients = normalizeIngredients()
  for (const ingredient of normalizedIngredients) {
    ingredient.hasRange = ingredient.quantityUpper.trim() !== ''

    if (!ingredient.textBefore.trim() && !ingredient.textAfter.trim()) {
      alert(t('edit.alert_ingredient_text_required'))
      return
    }
  }

  saving.value = true
  error.value = null

  try {
    await recipesManager.editExisting(recipe.value.id, {
      name: form.name.trim(),
      tags: normalizedTags,
      favorite: form.favorite,
      servings: form.servings || 1,
      ingredients: normalizedIngredients,
      instructions: form.instructions.trim(),
      notes: form.notes.trim(),
    })
    await router.replace({ name: 'recipe', params: { id: recipe.value.id } })
  } catch (err) {
    error.value = (err as Error).message
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <p v-if="error" class="error">{{ t('error') }}: {{ error }}</p>
  <div v-else-if="!loading" class="edit-recipe">
    <h2 class="heading--root">{{ t('Edit recipe') }}</h2>

    <form class="edit-recipe__form" @submit.prevent="onSave" autocomplete="off">
      <label for="edit-recipe__name" class="heading--muted">{{ t('Name') }}</label>
      <input id="edit-recipe__name" v-model.trim="form.name" type="text" />

      <div class="edit-recipe__servings">
        <label for="edit-recipe__servings" class="heading--muted">{{ t('Servings') }}</label>
        <input
          id="edit-recipe__servings"
          v-model.number="form.servings"
          type="number"
          min="1"
          max="999"
          placeholder="1"
          @input="validateServingsInput"
        />
      </div>

      <label for="edit-recipe__tags" class="heading--muted">
        {{ t('Tags') }} {{ t('tags_hint') }}
      </label>
      <input id="edit-recipe__tags" v-model="form.tags" type="text" />

      <label for="edit-recipe__favorite" class="heading--muted">{{ t('Favorite') }}</label>
      <input id="edit-recipe__favorite" v-model="form.favorite" type="checkbox" />

      <fieldset class="edit-recipe__ingredients" aria-label="Ingredients">
        <legend class="heading--muted">{{ t('Ingredients') }}</legend>
        <ul class="edit-recipe__ingredients-list">
          <li v-for="(ingredient, index) in form.ingredients" :key="index" class="ingredient-row">
            <ButtonMulti
              class="edit-recipe__remove-ingredient"
              :icon="CloseIcon"
              :desc="t('Remove')"
              @click="removeIngredient(index)"
            />
            <input
              v-model.trim="ingredient.textBefore"
              :aria-label="t('edit.ingredient_text_before')"
              :placeholder="t('edit.ingredient_text_before')"
              class="ingredient-row__text ingredient-row__text--before"
              type="text"
            />
            <div class="ingredient-row__amounts">
              <input
                v-model.trim="ingredient.quantity"
                :aria-label="t('edit.ingredient_quantity')"
                :placeholder="t('edit.ingredient_quantity')"
                class="ingredient-row__quantity"
                type="text"
                inputmode="decimal"
                @input="validateIngredientQuantityInput($event, ingredient, 'quantity')"
              />
              &nbsp;<span>{{ dashes[1] }}</span
              >&nbsp;
              <input
                v-model.trim="ingredient.quantityUpper"
                :aria-label="t('edit.ingredient_quantity_upper')"
                :placeholder="t('edit.ingredient_quantity_upper')"
                class="ingredient-row__quantity ingredient-row__quantity--upper"
                type="text"
                inputmode="decimal"
                :disabled="!ingredient.quantity.trim()"
                @input="validateIngredientQuantityInput($event, ingredient, 'quantityUpper')"
              />
            </div>
            <input
              v-model.trim="ingredient.unit"
              :aria-label="t('Unit')"
              :disabled="!ingredient.quantity.trim()"
              :placeholder="t('Unit')"
              class="ingredient-row__unit"
              list="edit-recipe__units"
              type="text"
            />
            <input
              v-model.trim="ingredient.textAfter"
              :aria-label="t('edit.ingredient_text_after')"
              :placeholder="t('edit.ingredient_text_after')"
              class="ingredient-row__text ingredient-row__text--after"
              type="text"
            />
          </li>
        </ul>
        <ButtonMulti
          class="edit-recipe__add-ingredient"
          :icon="AddIcon"
          :desc="t('edit.add_ingredient')"
          showDesc
          @click="addIngredient"
        />
      </fieldset>

      <datalist id="edit-recipe__units">
        <option v-for="unit in unitOptions" :key="unit" :value="unit" />
      </datalist>

      <label for="edit-recipe__instructions" class="heading--muted">{{ t('Instructions') }}</label>
      <textarea
        id="edit-recipe__instructions"
        v-model.trim="form.instructions"
        @focus="fitTextareaHeight"
        @blur="resetTextareaHeight"
        @input="fitTextareaHeight"
      ></textarea>

      <label for="edit-recipe__notes" class="heading--muted">{{ t('Notes') }}</label>
      <textarea
        id="edit-recipe__notes"
        v-model.trim="form.notes"
        @focus="fitTextareaHeight"
        @blur="resetTextareaHeight"
        @input="fitTextareaHeight"
      ></textarea>

      <ButtonMulti
        :icon="CheckIcon"
        :desc="saving ? t('sync.status_pushing') : t('Save changes')"
        :disabled="saving"
        showDesc
        @click="onSave"
      />
    </form>
  </div>
</template>

<style scoped>
.edit-recipe__ingredients {
  border: none;
  margin: 0 0 var(--inner-spacing) 0;
  padding: 0;
}

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

.edit-recipe__servings input {
  width: 3em;
  text-align: center;
}

.edit-recipe__ingredients-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.edit-recipe__ingredients-list > li + li {
  margin-top: var(--inner-spacing);
}

.ingredient-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  position: relative;
  padding: var(--inner-spacing) calc(var(--inner-spacing) / 2);
  background-color: var(--bg);
  border: 1px solid var(--bg-lighter);
  border-radius: var(--border-radius);

  input {
    margin-block-end: calc(var(--inner-spacing) / 2);
  }

  button.edit-recipe__remove-ingredient {
    position: absolute;
    max-width: 30px;
    max-height: 30px;
    inset: -5px -10px auto auto;
    padding: 5px;
    background-color: transparent;
    box-shadow: none;
    border: 2px solid var(--bg-lighter);
  }
}

button.edit-recipe__add-ingredient {
  margin: var(--inner-spacing) auto var(--inner-spacing) auto;
}

.ingredient-row__amounts {
  display: flex;
}
</style>
