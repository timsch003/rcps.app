<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { useSortable } from '@vueuse/integrations/useSortable'
import { t } from '@/lang/i18n'
import { useRouter } from 'vue-router'
import CheckIcon from '@/views/icons/IconCheck.vue'
import ArrowLeftIcon from '../icons/IconArrowLeft.vue'
import DragHandleIcon from '../icons/IconDragHandle.vue'
import ButtonMulti from './ButtonMulti.vue'
import InfoIcon from '@/views/icons/IconInfo.vue'
import SpinnerIcon from '../icons/IconSpinner.vue'
import { getCssCustomPropertyDurationMs, limitDecimals } from '@/utils/conversion'
import { dashes } from '@/utils/fixed_values'
import { recipesManager } from '@/services/recipes_manager'
import type { RecipeRaw } from '@/types'
import type { RecipeLocal } from '@/types'
import type { Options as SortableOptions } from 'sortablejs'

const data = defineModel<RecipeRaw>('data')
const checking = defineModel<boolean>('checking')
const ingredientsInfoElement = ref<HTMLDivElement | null>(null)
const ingredientsInfoVisible = ref(false)
const isValidating = ref(false)
const router = useRouter()
const props = defineProps<{
  editingRecipeId?: RecipeLocal['id'] | null
}>()

const sortableIngredients = computed<RecipeRaw['matchedIngredients']>({
  get: () => data.value?.matchedIngredients || [],
  set: (ingredients) => {
    if (data.value) data.value.matchedIngredients = ingredients
  },
})

const sortableOptions: SortableOptions = {
  animation: getCssCustomPropertyDurationMs('--transition-duration', 150),
  handle: '.drag-handle',
  filter:
    '.checkcorrect__ingredient-quantity-unit--selected, .checkcorrect__ingredient-quantity-unit--ignored',
  preventOnFilter: false,
  forceFallback: true,
  fallbackOnBody: true,
  fallbackClass: 'checkcorrect__sortable-fallback',
}

useSortable('.checkcorrect__ingredients-list', sortableIngredients, sortableOptions)

onMounted(async () => {
  ingredientsInfoElement.value = document.querySelector(
    'div.checkcorrect__ingredients-info--overlay',
  ) as HTMLDivElement

  addEventListener('click', (e) => {
    if (
      ingredientsInfoVisible.value &&
      ingredientsInfoElement.value &&
      !ingredientsInfoElement.value.contains(e.target as Node) &&
      !(e.target as HTMLElement).closest('button')
    ) {
      toggleIngredientsInfoOverlay()
    }
  })
})

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

function selectQuantityUnit(e: Event, ingredientIndex: number, partIndex: number) {
  const span = e.target as HTMLSpanElement
  const className = 'checkcorrect__ingredient-quantity-unit--selected'

  span
    .closest('li')
    ?.querySelectorAll('span.checkcorrect__ingredient-quantity-unit')
    ?.forEach((s) => s.classList.remove(className))
  span.classList.add(className)

  if (
    !data?.value?.matchedIngredients ||
    typeof data?.value?.matchedIngredients[ingredientIndex] === 'string' ||
    !data?.value?.matchedIngredients[ingredientIndex] ||
    !data.value.matchedIngredients[ingredientIndex][partIndex]
  )
    return

  data.value.matchedIngredients[ingredientIndex].forEach((ing) => {
    if (typeof ing !== 'string') ing.selected = false
  })

  data.value.matchedIngredients[ingredientIndex][partIndex].selected = true
}

function onBackToEditing() {
  checking.value = false
  // Reset ingredients matching to keep data consistent
  if (data?.value?.matchedIngredients) data.value.matchedIngredients = []
}

async function onCreate() {
  if (isValidating.value) return

  isValidating.value = true

  let recipeId: RecipeLocal['id'] | undefined

  if (props.editingRecipeId) {
    recipeId = await recipesManager.editExisting(props.editingRecipeId, data.value!)
  } else {
    recipeId = await recipesManager.addNew(data.value!)
  }

  if (recipeId) router.replace({ name: 'recipe', params: { id: recipeId } })

  isValidating.value = false
}
</script>

<template>
  <div>
    <ButtonMulti
      :icon="ArrowLeftIcon"
      :desc="t('Back to editing')"
      showDesc
      @click="onBackToEditing"
    />
    <div class="checkcorrect">
      <h2 class="heading--root">{{ t('Check & correct') }}</h2>

      <h3 class="heading--muted">{{ t('Name') }}</h3>
      <p>{{ data?.name }}</p>

      <h3 class="heading--muted">{{ t('Servings') }}</h3>
      <p>{{ data?.servings }}</p>

      <h3 class="heading--muted">{{ t('Tags') }}</h3>
      <p>
        <span v-if="!data?.tags.length">{{ '-' }}</span>
        <span v-else v-for="(tag, index) in data?.tags" :key="index"
          >{{ tag }}{{ index < data.tags.length - 1 ? ', ' : '' }}</span
        >
      </p>

      <h3 class="heading--muted">{{ t('Favorite') }}</h3>
      <p>{{ data?.favorite ? t('Yes') : t('No') }}</p>

      <h3 class="heading--muted heading--with-icon">
        {{ t('Ingredients') }}
        <ButtonMulti
          v-if="data?.matchedIngredients?.length"
          :icon="InfoIcon"
          :desc="t('Info')"
          inline
          @click="toggleIngredientsInfoOverlay"
        />
      </h3>
      <div class="checkcorrect__ingredients-info">
        <div class="checkcorrect__ingredients-info--overlay">
          <p>
            {{ t('checkcorrect.ingredients_info') }}
          </p>
          <p>
            {{ t('checkcorrect.ingredients_info_legend') }}
          </p>
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
            {{ t('checkcorrect.ingredients_info_sort') }}
            &nbsp;<span><DragHandleIcon class="drag-handle" /></span>
          </p>
        </div>
      </div>

      <ul v-if="data?.matchedIngredients?.length" class="checkcorrect__ingredients-list">
        <li v-for="(mi, ingIndex) in data?.matchedIngredients" :key="ingIndex">
          <DragHandleIcon class="drag-handle" />
          <span v-if="typeof mi === 'string'">{{ mi }}</span>

          <span v-else-if="mi.length === 1">
            <span v-if="mi[0]" class="checkcorrect__ingredient-quantity-unit--single">
              {{ mi[0].quantity && limitDecimals(Number(mi[0].quantity))
              }}{{
                mi[0].quantityUpper ? dashes[1]! + limitDecimals(Number(mi[0].quantityUpper)) : ''
              }}
              {{ mi[0].knownUnit && mi[0].knownUnit }}</span
            >
            <span v-if="mi[0]!.textAfterQuantity">{{ mi[0]!.textAfterQuantity }}</span>
          </span>

          <span v-else-if="mi.length > 1">
            <template v-for="(part, index) in mi" :key="index">
              <span v-if="typeof part !== 'string' && part.textBeforeFirstMatch">{{
                part.textBeforeFirstMatch + ' '
              }}</span>
              <span
                v-if="typeof part !== 'string' && part.quantity"
                :class="
                  typeof part !== 'string' && part.selected
                    ? 'checkcorrect__ingredient-quantity-unit--selected'
                    : 'checkcorrect__ingredient-quantity-unit--ignored'
                "
                @click="selectQuantityUnit($event, ingIndex, index)"
              >
                {{
                  typeof part !== 'string' && part.quantity && limitDecimals(Number(part.quantity))
                }}{{
                  typeof part !== 'string' && part.quantityUpper
                    ? dashes[1]! + limitDecimals(Number(part.quantityUpper))
                    : ''
                }}
                {{ typeof part !== 'string' && part.knownUnit && part.knownUnit }}</span
              >
              <span v-if="typeof part !== 'string' && part.textAfterQuantity">{{
                part.textAfterQuantity
              }}</span>
            </template>
          </span>
        </li>
      </ul>
      <p v-else>-</p>

      <h3 class="heading--muted">{{ t('Instructions') }}</h3>
      <p class="multiline_text">{{ data?.instructions || '-' }}</p>

      <h3 class="heading--muted">{{ t('Notes') }}</h3>
      <p class="multiline_text">{{ data?.notes || '-' }}</p>
    </div>
    <div class="submit">
      <ButtonMulti
        :icon="CheckIcon"
        :desc="props.editingRecipeId ? t('Save changes') : t('Create recipe')"
        showDesc
        @click="onCreate"
        :disabled="isValidating"
      />
      <SpinnerIcon v-if="isValidating" />
    </div>
  </div>
</template>

<style scoped>
div.checkcorrect {
  --ingredient-line-height: 2;

  margin-top: calc(var(--inner-spacing) * 1.5);
  margin-bottom: calc(var(--inner-spacing) * 2);
}

h3.heading--with-icon {
  display: flex;
  align-items: center;
  gap: var(--inner-spacing);

  button svg {
    width: 1em;
    height: 1em;
  }
}

p:not(:last-child),
ul {
  padding-bottom: var(--inner-spacing);
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
  }
}

ul {
  --ing-spacing: 5px;
  padding-top: var(--ing-spacing);
}

li {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--ing-spacing);
  padding-bottom: var(--ing-spacing);
  border-bottom: 1px solid var(--decor);
  margin-bottom: var(--ing-spacing);
}

.drag-handle {
  flex-shrink: 0;
  width: var(--icon-size-sm);
  height: var(--icon-size-sm);
  color: var(--text-muted, var(--decor));
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

li,
p.checkcorrect__ingredients-info--overlay-legend {
  /* Taller line height to make sure highlighting doesn't overlap */
  line-height: var(--ingredient-line-height);
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
}

.checkcorrect__ingredient-quantity-unit--selected {
  border-top: var(--border-width) solid var(--color-selected);
  border-bottom: var(--border-width) solid var(--color-selected);
  padding-block: var(--padding-selected);
}

div.checkcorrect__ingredients-info--overlay {
  .checkcorrect__ingredient-quantity-unit--ignored,
  .checkcorrect__ingredient-quantity-unit--selected,
  .drag-handle {
    cursor: unset;
  }
}

span > svg {
  display: inline-block;
  vertical-align: middle;
}
</style>
