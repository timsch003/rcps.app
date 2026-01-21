<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { t } from '@/lang/i18n'
import CheckIcon from '@/views/icons/IconCheck.vue'
import IconArrowLeft from '../icons/IconArrowLeft.vue'
import ButtonMulti from './ButtonMulti.vue'
import { limitDecimals } from '@/utils/parsing'
import InfoIcon from '@/views/icons/IconInfo.vue'
import type { RawRecipe } from '@/types'

const data = defineModel<RawRecipe>('data')
const previewing = defineModel<boolean>('previewing')
const ingredientsInfoElement = ref<HTMLDivElement | null>(null)
const ingredientsInfoVisible = ref(false)
const deselectedIngredientParts = defineModel<{ ingredientIndex: number; partIndex: number }[]>(
  'deselectedIngredientParts',
)

onMounted(() => {
  ingredientsInfoElement.value = document.querySelector(
    'div.preview__ingredients-info--overlay',
  ) as HTMLDivElement

  addEventListener('click', (e) => {
    if (
      ingredientsInfoVisible.value &&
      ingredientsInfoElement.value &&
      !ingredientsInfoElement.value.contains(e.target as Node) &&
      !(e.target as HTMLElement).closest('button')
    ) {
      toggleIngredientsInfo()
    }
  })
})

function toggleIngredientsInfo() {
  if (!ingredientsInfoElement.value) return
  if (ingredientsInfoVisible.value) {
    ingredientsInfoElement.value.style.clipPath = 'inset(0 0 100% 0)'
    ingredientsInfoVisible.value = false
  } else {
    ingredientsInfoElement.value.style.clipPath = 'inset(0px 0px 0px 0px)'
    ingredientsInfoVisible.value = true
  }
}

function toggleIngredientPart(
  e: Event,
  withKnownUnit: boolean,
  ingredientIndex: number,
  partIndex: number,
) {
  const span = e.target as HTMLSpanElement
  const className = withKnownUnit
    ? 'preview__ingredient-quantity-unit--selected'
    : 'preview__ingredient-quantity--selected'

  span.classList.toggle(className)

  if (!span.classList.contains(className)) {
    deselectedIngredientParts.value?.push({ ingredientIndex, partIndex })
  } else {
    deselectedIngredientParts.value = deselectedIngredientParts.value?.filter(
      (d) => d.ingredientIndex !== ingredientIndex || d.partIndex !== partIndex,
    )
  }
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
  <ButtonMulti
    :icon="IconArrowLeft"
    :desc="t('Back to editing')"
    showDesc
    @click="previewing = false"
  />
  <div class="preview">
    <h2 class="heading--root">{{ t('Preview & Quick-correct') }}</h2>
    <h3 class="heading--muted">{{ t('Recipe Name') }}</h3>
    <p>{{ data?.name }}</p>
    <h3 class="heading--muted">{{ t('Tags') }}</h3>
    <p>{{ data?.tags ? data.tags : '-' }}</p>
    <h3 class="heading--muted">{{ t('Servings') }}</h3>
    <p>{{ data?.servings }}</p>
    <h3 class="heading--muted heading--with-icon">
      {{ t('Ingredients') }}
      <ButtonMulti :icon="InfoIcon" :desc="t('Info')" inline @click="toggleIngredientsInfo" />
    </h3>
    <div class="preview__ingredients-info">
      <div class="preview__ingredients-info--overlay">
        <p>
          <span class="preview__ingredient-quantity--selected">{{ t('Quantity') }}</span
          ><br />
          {{ t('preview.ingredients_info.quantity') }}
        </p>
        <p>
          <span class="preview__ingredient-quantity-unit--selected">{{
            t('Quantity and unit')
          }}</span
          ><br />
          {{ t('preview.ingredients_info.quantity_unit') }}
        </p>
        <p>
          {{ t('preview.ingredients_info.deselect') }}
        </p>
      </div>
    </div>
    <ul>
      <li v-for="(ing, IngIndex) in data?.matchedIngredients" :key="IngIndex">
        <span v-if="ing.parts!.length <= 0">{{ ing.trimmedLine }}</span>

        <span v-else v-for="(part, partIndex) in ing.parts" :key="partIndex">
          <span
            v-if="part.quantity && !part.knownUnit"
            class="preview__ingredient-quantity preview__ingredient-quantity--selected"
            @click="toggleIngredientPart($event, false, IngIndex, partIndex)"
          >
            {{ limitDecimals(part.quantity) }}</span
          >
          <span
            v-else-if="part.quantity && part.knownUnit"
            class="preview__ingredient-quantity-unit preview__ingredient-quantity-unit--selected"
            @click="toggleIngredientPart($event, true, IngIndex, partIndex)"
          >
            {{ limitDecimals(part.quantity) }} {{ part.knownUnit }}</span
          >
          <span v-if="part.text">{{ part.text }}</span>
        </span>
      </li>
    </ul>
    <h3 class="heading--muted">{{ t('Instructions') }}</h3>
    <p>{{ data?.instructions }}</p>
    <h3 class="heading--muted">{{ t('Notes') }}</h3>
    <p>{{ data?.notes }}</p>
  </div>
  <ButtonMulti :icon="CheckIcon" :desc="t('Create Recipe')" showDesc @click="onCreate" />
</template>

<style scoped>
div.preview {
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

div.preview__ingredients-info {
  position: relative;

  div.preview__ingredients-info--overlay {
    position: absolute;
    clip-path: inset(0px 0px 100% 0px);
    margin-top: 4px;
    padding: calc(var(--inner-spacing) * 1.5) var(--inner-spacing) var(--inner-spacing)
      var(--inner-spacing);
    background-color: var(--bg);
    border: 2px solid var(--decor);
    transition: clip-path var(--transition-duration);
  }
}

p:not(:last-child),
ul {
  padding-bottom: var(--inner-spacing);
}

li {
  --ing-spacing: 3px;
  line-height: 1.75;
  padding-bottom: var(--ing-spacing);
  border-bottom: 1px solid var(--bg-lighter);
  margin-bottom: var(--ing-spacing);
}

.preview__ingredient-quantity,
.preview__ingredient-quantity-unit,
.preview__ingredient-quantity--selected,
.preview__ingredient-quantity-unit--selected {
  padding-inline: 1px;
  font-weight: 600;
  cursor: pointer;
  border-radius: var(--border-radius);
}

.preview__ingredient-quantity,
.preview__ingredient-quantity-unit {
  border-top: 2px solid transparent;
  border-bottom: 2px solid transparent;
}

.preview__ingredient-quantity--selected,
.preview__ingredient-quantity-unit--selected {
  border-top: 2px solid var(--accent);
  border-bottom: 2px solid var(--accent);
}

.preview__ingredient-quantity--selected {
  border-radius: 0;
}
</style>
