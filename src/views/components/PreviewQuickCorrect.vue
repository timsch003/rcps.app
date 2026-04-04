<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { t } from '@/lang/i18n'
import { useRecipesStore } from '@/stores/recipes'
import { useTagsStore } from '@/stores/tags'
import { useIngredientsStore } from '@/stores/ingredients'
import { useRecipeIngredientsStore } from '@/stores/recipe_ingredients'
import { useRouter } from 'vue-router'
import CheckIcon from '@/views/icons/IconCheck.vue'
import IconArrowLeft from '../icons/IconArrowLeft.vue'
import ButtonMulti from './ButtonMulti.vue'
import InfoIcon from '@/views/icons/IconInfo.vue'
import SpinnerIcon from '../icons/IconSpinner.vue'
import { limitDecimals } from '@/lib/conversion'
import { v7 as uuidv7 } from 'uuid'
import type { RecipeRaw, RecipeLocal, UUID } from '@/types'

const data = defineModel<RecipeRaw>('data')
const previewing = defineModel<boolean>('previewing')
const ingredientsInfoElement = ref<HTMLDivElement | null>(null)
const ingredientsInfoVisible = ref(false)
const isValidating = ref(false)
const tagsStore = useTagsStore()
const recipesStore = useRecipesStore()
const ingredientsStore = useIngredientsStore()
const recipeIngredientsStore = useRecipeIngredientsStore()
const router = useRouter()

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

function setQuantityUnit(e: Event, ingredientIndex: number, partIndex: number) {
  const span = e.target as HTMLSpanElement
  const className = 'preview__ingredient-quantity-unit--selected'

  span
    .closest('li')
    ?.querySelectorAll('span.preview__ingredient-quantity-unit')
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
  previewing.value = false
  // Only keep raw ingredients string
  if (data?.value?.matchedIngredients) data.value.matchedIngredients = []
}

async function onCreate() {
  if (isValidating.value) return
  isValidating.value = true

  const newRecipeId = uuidv7()

  let tagIds: UUID[] = []
  let newOrExistingTags: Promise<UUID | undefined>[] = []
  if (Array.isArray(data.value?.tags)) {
    newOrExistingTags = data.value?.tags.map(async (newOrExistingTag) => {
      let tagId = await tagsStore.add(newOrExistingTag)
      if (!tagId) tagId = tagsStore.getExistingId(newOrExistingTag)
      return tagId
    })

    const resolvedIds = await Promise.all(newOrExistingTags)
    tagIds = resolvedIds.filter((id): id is UUID => id !== undefined)
  }

  let ingredientIds: UUID[] = []
  if (Array.isArray(data.value?.matchedIngredients)) {
    const recipeIngredientIdPromises: Promise<UUID | undefined>[] =
      data.value?.matchedIngredients.map(async (mi) => {
        const id = await ingredientsStore.add(mi)
        if (id) return id
      })

    const resolvedIds = await Promise.all(recipeIngredientIdPromises)
    ingredientIds = resolvedIds.filter((id): id is UUID => id !== undefined)
  }

  const recipeIngredientIds = await recipeIngredientsStore.addManyByIngredientId(
    newRecipeId,
    ingredientIds,
  )

  if (data.value?.matchedIngredients) {
    const newRecipe: RecipeLocal = {
      id: newRecipeId,
      name: data.value!.name!,
      tagIds: tagIds,
      servings: data.value?.servings || 1,
      recipeIngredientIds: recipeIngredientIds,
      instructions: data.value?.instructions,
      notes: data.value?.notes,
      synced: false,
    }

    console.log('Added recipe: ', newRecipe)

    const result = await recipesStore.add(newRecipe)

    if (result) router.push({ name: 'recipe', params: { id: result } })
    else alert(t('create.failed'))

    isValidating.value = false
  }
}
</script>

<template>
  <ButtonMulti
    :icon="IconArrowLeft"
    :desc="t('Back to editing')"
    showDesc
    @click="onBackToEditing"
  />
  <div class="preview">
    <h2 class="heading--root">{{ t('Preview & quick-correct') }}</h2>

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

    <h3 class="heading--muted heading--with-icon">
      {{ t('Ingredients') }}
      <ButtonMulti
        v-if="data?.matchedIngredients?.length"
        :icon="InfoIcon"
        :desc="t('Info')"
        inline
        @click="toggleIngredientsInfo"
      />
    </h3>
    <div class="preview__ingredients-info">
      <div class="preview__ingredients-info--overlay">
        <p>
          {{ t('preview.ingredients_info') }}
        </p>
      </div>
    </div>
    <ul v-if="data?.matchedIngredients?.length">
      <li v-for="(ing, ingIndex) in data?.matchedIngredients" :key="ingIndex">
        <span v-if="typeof ing === 'string'">{{ ing }}</span>

        <span v-else-if="ing.length === 1">
          <span v-if="ing[0]!.quantity" class="preview__ingredient-quantity-unit--single">
            {{ limitDecimals(ing[0]!.quantity) }} {{ ing[0]!.knownUnit }}</span
          >
          <span v-if="ing[0]!.textAfterQuantity">{{ ing[0]!.textAfterQuantity }}</span>
        </span>

        <span v-else-if="ing.length > 1" v-for="(part, partIndex) in ing" :key="partIndex">
          <span
            v-if="part.quantity"
            :class="
              part.selected
                ? 'preview__ingredient-quantity-unit--selected'
                : 'preview__ingredient-quantity-unit'
            "
            @click="setQuantityUnit($event, ingIndex, partIndex)"
          >
            {{ limitDecimals(part.quantity) }} {{ part.knownUnit }}</span
          >
          <span v-if="part.textAfterQuantity">{{ part.textAfterQuantity }}</span>
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
      :desc="t('Create recipe')"
      showDesc
      @click="onCreate"
      :disabled="isValidating"
    />
    <SpinnerIcon v-if="isValidating" />
  </div>
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

p:not(:last-child),
ul {
  padding-bottom: var(--inner-spacing);
}

div.preview__ingredients-info {
  position: relative;

  div.preview__ingredients-info--overlay {
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
  --ing-spacing: 10px;
  padding-top: var(--ing-spacing);
}

li {
  line-height: 1.5;
  padding-bottom: var(--ing-spacing);
  border-bottom: 1px solid var(--decor);
  margin-bottom: var(--ing-spacing);
}

.preview__ingredient-quantity-unit,
.preview__ingredient-quantity-unit--selected,
.preview__ingredient-quantity-unit--single {
  padding: 2px 1px;
  font-weight: 600;
  cursor: pointer;
  border-radius: var(--border-radius);
}

.preview__ingredient-quantity-unit--single {
  cursor: unset;
}

.preview__ingredient-quantity-unit {
  border-bottom: 2px solid transparent;
  text-decoration: underline;
}

.preview__ingredient-quantity-unit--selected {
  border-bottom: 2px solid var(--accent);
  text-decoration: none;
}
</style>
