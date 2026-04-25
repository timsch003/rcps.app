<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useWakeLock } from '@vueuse/core'
import { recipesManager } from '@/services/recipes_manager'
import { ingredientsManager } from '@/services/ingredients_manager'
import { tagsManager } from '@/services/tags_manager'
import { unitsManager } from '@/services/units_manager'
import { useSettingsStore } from '@/stores/settings'
import { limitDecimals } from '@/utils/conversion'
import { dashes } from '@/utils/fixed_values'
import { t } from '@/lang/i18n'
import ButtonMulti from './components/ButtonMulti.vue'
import type { RecipeLocal, RecipeIngredient, Tag } from '@/types'

const route = useRoute()
const loading = ref(false)
const recipe = ref<RecipeLocal | undefined>(undefined)
let ingredients: RecipeIngredient[] = []
let ingredientsStrings: string[][] = []
let tags: Tag['name'][] = []
let error: string | null = null

const settings = useSettingsStore().settings
const wakeLock = useWakeLock()

onMounted(async () => {
  loading.value = true
  try {
    recipe.value = await recipesManager.getById(route.params.id as string)
    if (!recipe.value) throw new Error(t('error.recipe_not_found'))

    if (recipe.value.recipeIngredientIds?.length) {
      ingredients = await ingredientsManager.getRecipeIngredients(recipe.value.recipeIngredientIds)
      ingredientsStrings = await Promise.all(
        ingredients.map(async (ing) => {
          const ingStrings = await getIngStrings(ing)
          return ingStrings ? ingStrings : []
        }),
      )
    }

    if (recipe.value.tagIds?.length) tags = await tagsManager.getNames(recipe.value.tagIds)

    if (settings?.keepScreenOn && wakeLock.isSupported.value) await wakeLock.request('screen')
  } catch (err) {
    error = (err as Error).message
  } finally {
    loading.value = false
  }
})

onUnmounted(() => {
  wakeLock.release()
})

async function getIngStrings(ri: RecipeIngredient): Promise<string[] | undefined> {
  try {
    const ingredientName = await ingredientsManager.getName(ri)

    if (!ingredientName) return undefined
    if (!ri.quantity) return [ingredientName]
    if (ri.quantityUnitPosition === undefined) throw new Error(t('error.no_quantity_position'))

    const stringBefore = ingredientName.substring(0, ri.quantityUnitPosition)
    const quantityString = `${String(limitDecimals(ri.quantity))}${ri.quantityUpper ? dashes[1]! + String(limitDecimals(ri.quantityUpper)) : ''}`
    const stringAfter = ingredientName.substring(ri.quantityUnitPosition)

    if (ri.unitId)
      return [
        stringBefore,
        `${quantityString} ${String(unitsManager.getNameById(ri.unitId))}`,
        stringAfter,
      ]
    else return [stringBefore, quantityString, stringAfter]
  } catch (err) {
    error = (err as Error).message
    return undefined
  }
}

function onServingsDecrease() {
  // TODO
}

function onServingsIncrease() {
  // TODO
}
</script>
<template>
  <p v-if="error" class="error">{{ t('error') }}: {{ error }}</p>
  <div class="recipe-view" v-else-if="!loading && recipe">
    <h2 class="heading--root">{{ recipe!.name }}</h2>

    <div v-if="recipe!.servings" class="servings">
      <h3 class="heading--muted">{{ `${t('Servings')}: ${recipe!.servings}` }}</h3>
      <ButtonMulti desc="-" showDesc :aria-label="t('Decrease')" @click="onServingsDecrease" />
      <ButtonMulti desc="+" showDesc :aria-label="t('Increase')" @click="onServingsIncrease" />
    </div>

    <h3 v-if="tags.length" class="heading--muted">{{ t('Tags') }}</h3>
    <p v-if="tags.length">
      <span v-for="(tag, index) in tags" :key="index"
        >{{ tag }}{{ index < tags.length - 1 ? ', ' : '' }}</span
      >
    </p>

    <h3 v-if="ingredientsStrings.length" class="heading--muted">{{ t('Ingredients') }}</h3>
    <ul v-if="ingredientsStrings.length">
      <li v-for="(ingStrings, index) in ingredientsStrings" :key="index">
        <span v-if="ingStrings.length === 1">{{ ingStrings[0] }}</span>
        <div v-else-if="ingStrings.length > 1">
          <span>{{ ingStrings[0] }}</span>
          <span class="quantity-unit">{{ ingStrings[1] + ' ' }}</span>
          <span>{{ ingStrings[2] }}</span>
        </div>
      </li>
    </ul>
    <h3 v-if="recipe?.instructions" class="heading--muted">{{ t('Instructions') }}</h3>
    <p v-if="recipe?.instructions">{{ recipe?.instructions }}</p>
    <h3 v-if="recipe?.notes" class="heading--muted">{{ t('Notes') }}</h3>
    <p v-if="recipe?.notes">{{ recipe?.notes }}</p>
  </div>
</template>

<style scoped>
.recipe-view {
  /* Prevent layout shift when transitioning out top nav */
  position: absolute;
  inset: var(--inner-spacing);
}

h3.heading--muted:not(:first-of-type) {
  margin-top: var(--inner-spacing);
}

div.servings {
  display: flex;
  align-items: center;
  gap: var(--inner-spacing);

  button {
    margin-bottom: 5px;
  }
}

li {
  line-height: 1.15;
  padding-bottom: 7px;
}

span.quantity-unit {
  font-weight: var(--quantity-unit-font-weight);
}
</style>
