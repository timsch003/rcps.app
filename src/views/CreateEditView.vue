<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import { onClickOutside } from '@vueuse/core'
import { useSortable } from '@vueuse/integrations/useSortable'
import ButtonMulti from '@/views/components/ButtonMulti.vue'
import { recipesManager } from '@/services/recipes_manager'
import { ingredientsManager } from '@/services/ingredients_manager'
import { useRoute, useRouter } from 'vue-router'
import { tagsManager } from '@/services/tags_manager'
import { dashes } from '@/utils/fixed_values'
import { getCssCustomPropertyDurationMs, limitDecimals } from '@/utils/conversion'
import { t } from '@/lang/i18n'
import ArrowLeftIcon from '@/views/icons/IconArrowLeft.vue'
import CheckIcon from '@/views/icons/IconCheck.vue'
import EditIcon from '@/views/icons/IconEdit.vue'
import CloseIcon from '@/views/icons/IconClose.vue'
import DragHandleIcon from '@/views/icons/IconDragHandle.vue'
import InfoIcon from '@/views/icons/IconInfo.vue'
import SpinnerIcon from '@/views/icons/IconSpinner.vue'
import type { RecipeLocal, RecipeRaw } from '@/types'
import type { UseSortableOptions } from '@vueuse/integrations/useSortable'

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
const route = useRoute()
const router = useRouter()
const editingRecipeId = ref<RecipeLocal['id'] | null>(null)
const loading = ref(false)
const isValidating = ref(false)
const ingredientsInfoVisible = ref(false)
const ingredientsInfoElement = ref<HTMLDivElement | null>(null)
const ingredientsListElement = ref<HTMLElement | null>(null)
const ingredientsTextarea = ref<HTMLTextAreaElement | null>(null)
const instructionsTextarea = ref<HTMLTextAreaElement | null>(null)
const notesTextarea = ref<HTMLTextAreaElement | null>(null)
const editingIngredients = ref(true)

const sortableIngredients = computed<RecipeRaw['matchedIngredients']>({
  get: () => data.matchedIngredients || [],
  set: (ingredients) => {
    data.matchedIngredients = ingredients
  },
})

const sortableOptions: UseSortableOptions = {
  animation: getCssCustomPropertyDurationMs('--transition-duration', 150),
  handle: '.drag-handle',
  filter:
    '.checkcorrect__ingredient-quantity-unit--selected, .checkcorrect__ingredient-quantity-unit--ignored',
  preventOnFilter: false,
  forceFallback: true,
  fallbackOnBody: true,
  fallbackClass: 'checkcorrect__sortable-fallback',
  watchElement: true,
}

useSortable(ingredientsListElement, sortableIngredients, sortableOptions)

onClickOutside(
  ingredientsInfoElement,
  () => {
    if (ingredientsInfoVisible.value) toggleIngredientsInfoOverlay()
  },
  { ignore: ['button'] },
)

onMounted(async () => {
  scrollTo(0, 0)

  const recipeId = route.params.id as string | undefined

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
              return await ingredientsManager.getIngStrings(ri)
            }),
          )
          data.ingredients = ingStrings
            .filter((strings) => strings && strings.length > 0)
            .map((strings) => (strings ? strings.join('') : ''))
            .join('\n')

          if (data.ingredients) {
            data.matchedIngredients = ingredientsManager.matchAndNormalize(data.ingredients)
            editingIngredients.value = false
          }
        }
      }
    } catch (err) {
      console.error('Failed to load recipe for editing:', err)
    } finally {
      loading.value = false
    }
  }

  await nextTick()
  fitTextareaToContent(instructionsTextarea.value)
  fitTextareaToContent(notesTextarea.value)
})

const validateServingsInput = (e: Event) => {
  const input = e.target as HTMLInputElement
  const value = input.value.trim()
  input.value = /^\d{0,4}$/g.test(value) ? value : '1'
  if (Number(input.value) <= 0) input.value = '1'
}

function normalizeTags() {
  data.tags = Array.isArray(data.tags)
    ? data.tags
    : data.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag !== '')
}

function toggleIngredientsInfoOverlay() {
  if (!ingredientsInfoElement.value) return

  if (ingredientsInfoVisible.value) {
    ingredientsInfoElement.value.style.clipPath = 'inset(0 0 100% 0)'
    ingredientsInfoVisible.value = false
  } else {
    ingredientsInfoElement.value.style.clipPath = 'inset(0px 0px 0px 0px)'
    ingredientsInfoVisible.value = true
  }
}

function onIngredientsBlur() {
  if (!editingIngredients.value) return

  data.matchedIngredients = data.ingredients
    ? ingredientsManager.matchAndNormalize(data.ingredients)
    : []

  editingIngredients.value = false

  const headerHeight = document.querySelector('main > header')?.clientHeight || 0
  const ingAnchor = document.querySelector(
    '#checkcorrect__ingredients-anchor',
  ) as HTMLElement | null
  if (ingAnchor) {
    ingAnchor.style.scrollMarginTop = `calc(${headerHeight}px + 4px)`
    ingAnchor.scrollIntoView({
      behavior: 'smooth',
    })
  }
}

function onEditIngredients() {
  rebuildIngredientsTextFromMatched()
  editingIngredients.value = true
  nextTick(() => {
    fitTextareaToContent(ingredientsTextarea.value)
    ingredientsTextarea.value?.focus()
  })
}

function rebuildIngredientsTextFromMatched() {
  if (!data.matchedIngredients.length) return

  data.ingredients = data.matchedIngredients
    .map((mi) => (typeof mi === 'string' ? mi : mi[0] && mi[0].normalizedLine))
    .join('\n')
}

function removeIngredient(index: number) {
  data.matchedIngredients.splice(index, 1)
}

function selectQuantityUnit(e: Event, ingredientIndex: number, partIndex: number) {
  const span = e.target as HTMLSpanElement
  const className = 'checkcorrect__ingredient-quantity-unit--selected'

  span
    .closest('li')
    ?.querySelectorAll('span.checkcorrect__ingredient-quantity-unit')
    ?.forEach((s) => s.classList.remove(className))
  span.classList.add(className)

  if (
    !data.matchedIngredients ||
    typeof data.matchedIngredients[ingredientIndex] === 'string' ||
    !data.matchedIngredients[ingredientIndex] ||
    !data.matchedIngredients[ingredientIndex][partIndex]
  )
    return

  data.matchedIngredients[ingredientIndex].forEach((ing) => {
    if (typeof ing !== 'string') ing.selected = false
  })

  data.matchedIngredients[ingredientIndex][partIndex].selected = true
}

const fitTextareaHeight = (e: Event) => {
  const textarea = e.target as HTMLTextAreaElement
  fitTextareaToContent(textarea)
}

function fitTextareaToContent(textarea: HTMLTextAreaElement | null) {
  if (!textarea) return
  textarea.style.height = 'auto'
  textarea.style.height = `${textarea.scrollHeight}px`
}

async function onCreateEdit() {
  if (isValidating.value) return

  if (!data.name) {
    alert(t('create_edit.alert_name_required'))
    return
  }
  if (!editingRecipeId.value && (await recipesManager.nameExists(data.name))) {
    alert(t('create_edit.alert_name_exists'))
    return
  }
  if (!data.tags.length || (typeof data.tags === 'string' && !data.tags.trim())) {
    alert(t('create_edit.alert_tags_required'))
    return
  }

  isValidating.value = true

  data.servings = data.servings || 1

  normalizeTags()

  if (data.ingredients && !data.matchedIngredients.length) {
    data.matchedIngredients = ingredientsManager.matchAndNormalize(data.ingredients)
  }

  const recipeId = await recipesManager.createEdit(data, editingRecipeId.value || undefined)
  if (recipeId) router.replace({ name: 'recipe', params: { id: recipeId } })

  isValidating.value = false
}
</script>

<template>
  <div class="transition-navs-out-view">
    <ButtonMulti
      class="create_edit__discard-button"
      :icon="CloseIcon"
      :desc="editingRecipeId ? t('create_edit.discard_changes') : t('create_edit.discard')"
      showDesc
      @click="
        editingRecipeId
          ? router.replace({ name: 'recipe', params: { id: route.params.id } })
          : router.back()
      "
    />

    <h2 class="heading--root">{{ editingRecipeId ? t('Edit recipe') : t('Create recipe') }}</h2>

    <p v-if="loading" class="loading">{{ t('sync.status_pulling') }}</p>

    <form v-if="!loading" class="create" @submit.prevent>
      <label for="create__name-input" class="heading--muted">{{ t('Name') }}</label>
      <input type="text" id="create__name-input" v-model.trim="data.name" />

      <div class="create__servings">
        <label for="create__servings-input" class="heading--muted">{{ t('Servings') }}</label>
        <input
          type="number"
          id="create__servings-input"
          v-model.number="data.servings"
          @blur="validateServingsInput"
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

      <div id="checkcorrect__ingredients-anchor"></div>
      <label
        v-if="editingIngredients"
        for="create__ingredients-input"
        class="heading--muted"
        id="create__ingredients-heading"
      >
        {{ t('Ingredients') }} {{ t('create_edit.ingredients_hint') }}
      </label>
      <h3 v-else class="heading--muted heading--with-icon">
        {{ t('Ingredients') }}
        <ButtonMulti
          v-if="data.matchedIngredients.length"
          :icon="InfoIcon"
          :desc="t('Info')"
          inline
          @click="toggleIngredientsInfoOverlay"
        />
        <ButtonMulti :icon="EditIcon" :desc="t('Edit')" inline @click="onEditIngredients" />
      </h3>

      <textarea
        v-if="editingIngredients"
        ref="ingredientsTextarea"
        id="create__ingredients-input"
        v-model.trim="data.ingredients"
        @blur="onIngredientsBlur"
        @focusout="onIngredientsBlur"
        @input="fitTextareaHeight"
      ></textarea>
      <div v-else class="checkcorrect__ingredients-container">
        <div class="checkcorrect__ingredients-info">
          <div ref="ingredientsInfoElement" class="checkcorrect__ingredients-info--overlay">
            <p>
              {{ t('checkcorrect.ingredients_info') }}
            </p>
            <p>
              {{ t('checkcorrect.ingredients_info_legend') }}
            </p>
            <br />
            <p class="checkcorrect__ingredients-info--overlay-legend">
              <span class="checkcorrect__ingredient-quantity-unit--selected">
                {{ t('checkcorrect.ingredients_info_selected') }}
              </span>
              &nbsp;
              <span class="checkcorrect__ingredient-quantity-unit--ignored">
                {{ t('checkcorrect.ingredients_info_ignored') }}
              </span>
              &nbsp;
              <span class="checkcorrect__ingredient-quantity-unit--single">{{
                t('checkcorrect.ingredients_info_detected')
              }}</span>
            </p>
            <br />
            <p>
              {{ t('checkcorrect.ingredients_info_remove-sort1')
              }}<span><CloseIcon class="checkcorrect__remove-button" /></span>
            </p>
            <p>
              {{ t('checkcorrect.ingredients_info_remove-sort2')
              }}<span><DragHandleIcon class="drag-handle" /></span>
            </p>
          </div>
        </div>

        <ul
          v-if="data.matchedIngredients.length"
          ref="ingredientsListElement"
          class="checkcorrect__ingredients-list"
        >
          <li v-for="(mi, ingIndex) in data.matchedIngredients" :key="ingIndex">
            <DragHandleIcon class="drag-handle" />

            <!-- Keep span elements on the same line to avoid unwanted whitespace -->
            <span v-if="typeof mi === 'string'">{{ mi }}</span
            ><span v-else-if="mi.length === 1 && mi[0]"
              ><span v-if="mi[0].textBeforeFirstMatch">{{ mi[0].textBeforeFirstMatch + ' ' }}</span
              ><span v-if="mi[0]" class="checkcorrect__ingredient-quantity-unit--single">
                {{
                  mi[0].quantity &&
                  limitDecimals(Number(mi[0].quantity)) + (mi[0].quantityUpper ? '' : ' ')
                }}{{
                  mi[0].quantityUpper
                    ? dashes[1] && dashes[1] + limitDecimals(Number(mi[0].quantityUpper))
                    : ''
                }}{{ mi[0].knownUnit && mi[0].knownUnit }}</span
              ><span v-if="mi[0].textAfterQuantity">{{ mi[0].textAfterQuantity }}</span></span
            >

            <span v-else-if="mi.length > 1 && mi[0]">
              <span v-if="mi[0].textBeforeFirstMatch">{{ mi[0].textBeforeFirstMatch }}</span>
              <template v-for="(qut, index) in mi" :key="index">
                <!-- Keep span elements on the same line to avoid unwanted whitespace -->
                <span>{{ index <= mi.length || mi[0].textBeforeFirstMatch ? ' ' : '' }}</span
                ><span
                  class="checkcorrect__ingredient-quantity-unit"
                  :class="{
                    'checkcorrect__ingredient-quantity-unit--ignored': !qut.selected,
                    'checkcorrect__ingredient-quantity-unit--selected': qut.selected,
                  }"
                  @click="selectQuantityUnit($event, ingIndex, index)"
                  >{{ qut.quantity && limitDecimals(Number(qut.quantity))
                  }}{{
                    qut.quantityUpper
                      ? dashes[1] && dashes[1] + limitDecimals(Number(qut.quantityUpper))
                      : ''
                  }}{{ qut.quantityUpper || index <= mi.length ? '' : ' '
                  }}{{ qut.knownUnit && ' ' + qut.knownUnit }}</span
                ><span v-if="qut.textAfterQuantity">{{ qut.textAfterQuantity }}</span>
              </template>
            </span>

            <CloseIcon
              class="checkcorrect__remove-button"
              role="button"
              aria-label="Remove ingredient"
              @click="removeIngredient(ingIndex)"
            />
          </li>
        </ul>
        <p class="create__empty" v-else>-</p>
      </div>

      <label for="create__instructions-input" class="heading--muted">{{ t('Instructions') }}</label>
      <textarea
        ref="instructionsTextarea"
        id="create__instructions-input"
        v-model.trim="data.instructions"
        @input="fitTextareaHeight"
      ></textarea>

      <label for="create__notes-input" class="heading--muted">{{ t('Notes') }}</label>
      <textarea
        ref="notesTextarea"
        id="create__notes-input"
        v-model.trim="data.notes"
        @input="fitTextareaHeight"
      ></textarea>

      <div class="submit">
        <ButtonMulti
          :icon="CheckIcon"
          :desc="editingRecipeId ? t('Save changes') : t('Create recipe')"
          showDesc
          @click="onCreateEdit"
          :disabled="isValidating"
        />
        <SpinnerIcon v-if="isValidating" />
      </div>
    </form>
  </div>
</template>

<style scoped>
.create input,
.create textarea {
  margin-block-end: 0;
}
h2.heading--root,
.create_edit__discard-button,
.create > input,
.create > textarea,
.create > ul.checkcorrect__tags,
.create > .checkcorrect__ingredients-container,
.create > .create__empty,
.create > .create__servings {
  margin-block-end: var(--inner-spacing-m);
}

h2.heading--root {
  padding: 0;
}

h3.heading--muted,
label.heading--muted {
  max-width: max-content;
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

.create__servings input {
  width: 4em;
  text-align: center;
}

h3.heading--with-icon {
  display: flex;
  align-items: center;
  gap: var(--inner-spacing);
  margin-bottom: 4px;

  button svg {
    width: 1em;
    height: 1em;
  }
}

.checkcorrect__remove-button,
.checkcorrect__remove-button:hover,
.checkcorrect__remove-button:active,
.checkcorrect__remove-button:focus {
  margin-inline-start: auto;
  background-color: none;
  color: var(--text);
  opacity: var(--secondary-opacity);
  cursor: pointer;
}

div#checkcorrect__ingredients-anchor {
  visibility: hidden;
}

textarea#create__ingredients-input {
  white-space: nowrap;
  overflow-x: auto;
}

div.checkcorrect__ingredients-info {
  position: relative;

  div.checkcorrect__ingredients-info--overlay {
    position: absolute;
    z-index: 7;
    clip-path: inset(0px 0px 100% 0px);
    padding: var(--inner-spacing);
    background-color: var(--bg);
    border: 2px solid var(--decor);
    transition: clip-path var(--transition-duration);

    .drag-handle,
    .checkcorrect__remove-button {
      display: inline-block;
      vertical-align: middle;
    }
  }
}

ul.checkcorrect__ingredients-list {
  --ing-spacing: 5px;
}

ul.checkcorrect__ingredients-list li {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--ing-spacing);
  padding-bottom: var(--ing-spacing);
  border-bottom: 1px solid var(--decor);
  margin-bottom: var(--ing-spacing);
}
ul.checkcorrect__ingredients-list li:first-child {
  padding-top: var(--ing-spacing);
  border-top: 1px solid var(--decor);
}
ul.checkcorrect__ingredients-list li:last-child {
  margin-bottom: 0;
}

ul.checkcorrect__ingredients-list li,
p.checkcorrect__ingredients-info--overlay-legend {
  line-height: 2;
}

.checkcorrect__ingredient-quantity-unit--ignored,
.checkcorrect__ingredient-quantity-unit--selected,
.checkcorrect__ingredient-quantity-unit--single {
  --color-selected: var(--accent);
  --color-ignored: var(--decor-light);
  --border-width: 3px;
  --padding-selected: 1px;
  --padding-ignored: 3px;

  font-weight: var(--quantity-unit-font-weight);
  border-radius: var(--border-radius);
  padding-inline: 2px;
  padding-block: 2px;
  cursor: pointer;
  transition:
    padding var(--transition-duration),
    border-color var(--transition-duration);
}

.checkcorrect__ingredient-quantity-unit--single {
  color: var(--text);
  cursor: unset;
}

.checkcorrect__ingredient-quantity-unit--ignored {
  border-top: var(--border-width) solid var(--color-ignored);
  border-bottom: var(--border-width) solid var(--color-ignored);
  padding-block: var(--padding-ignored);
  position: relative;
  z-index: 1;
}

.checkcorrect__ingredient-quantity-unit--selected {
  border-top: var(--border-width) solid var(--color-selected);
  border-bottom: var(--border-width) solid var(--color-selected);
  padding-block: var(--padding-selected);
  position: relative;
  z-index: 2;
}

div.checkcorrect__ingredients-info--overlay {
  .checkcorrect__ingredient-quantity-unit--ignored,
  .checkcorrect__ingredient-quantity-unit--selected,
  .drag-handle {
    cursor: unset;
  }
}

.drag-handle {
  flex-shrink: 0;
  width: var(--icon-size-sm);
  height: var(--icon-size-sm);
  color: var(--text);
  opacity: var(--secondary-opacity);
  cursor: grab;
  touch-action: none;
}

.drag-handle:active {
  cursor: grabbing;
}

:global(.checkcorrect__sortable-fallback) {
  opacity: 0 !important;
  pointer-events: none !important;
}
</style>
