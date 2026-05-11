import { nextTick } from 'vue'
import { db } from '@/adapters/dexie'
import {
  upsertRecord,
  deleteRecord,
  fetchAll,
  updateUserSettings,
  fetchUserSettings,
} from '@/adapters/pocketbase'
import { useSyncStore } from '@/stores/sync_status'
import { useAuthStore } from '@/stores/auth'
import { useSettingsStore } from '@/stores/settings'
import { tagsManager } from './tags_manager'
import { unitsManager } from './units_manager'
import type { RecipeLocal, Ingredient, Tag, Unit, Recipe } from '@/types'

// Init sync store after pinia
let syncStore: ReturnType<typeof useSyncStore>
nextTick(() => (syncStore = useSyncStore()))

async function init(): Promise<void> {
  await pushLocalChanges()
  await pullRemoteData()
}

async function pushLocalChanges(): Promise<{
  success: boolean
  pushedRecipes?: number
  errors?: string
}> {
  const authStore = useAuthStore()
  const userId = authStore.user?.id

  if (!authStore.isAuth || !authStore.user) {
    syncStore.setStatus('error')
    return { success: false, errors: 'Not authenticated' }
  }

  if (!userId) {
    syncStore.setStatus('error')
    return { success: false, errors: 'No user ID' }
  }

  // Always push user settings regardless of whether there are recipes to push
  const settingsStore = useSettingsStore()
  const currentSettings = { ...settingsStore.settings }
  if (Object.keys(currentSettings).length) {
    if (syncStore.isOffline()) {
      syncStore.setStatus('unsynced')
      return { success: false, errors: 'Offline' }
    }
    syncStore.setStatus('pushing')
    await updateUserSettings(userId, currentSettings)
  }

  // Gather unsynced recipes to push
  const unsyncedRecipes = await db.recipes.filter((r) => !r.synced).toArray()
  if (unsyncedRecipes.length === 0) {
    syncStore.setStatus('synced')
    return { success: true, pushedRecipes: 0 }
  }

  if (syncStore.isOffline()) {
    if (unsyncedRecipes.length) syncStore.setStatus('unsynced')
    return { success: false, errors: 'Offline' }
  }

  syncStore.setStatus('pushing')

  const errors: string[] = []

  for (const recipe of unsyncedRecipes) {
    try {
      // Push tags referenced by this recipe
      if (recipe.tagIds?.length) {
        const tags = await db.tags.where('id').anyOf(recipe.tagIds).toArray()
        for (const tag of tags) {
          await upsertRecord('tags', { id: tag.id, name: tag.name })
        }
      }

      // Push ingredients and units referenced by recipe ingredients
      if (recipe.recipeIngredientIds?.length) {
        const ris = await db.recipe_ingredients
          .where('id')
          .anyOf(recipe.recipeIngredientIds)
          .toArray()

        const ingredientIds = [...new Set(ris.map((ri) => ri.ingredientId))]
        const ingredients = await db.ingredients.where('id').anyOf(ingredientIds).toArray()
        for (const ing of ingredients) {
          await upsertRecord('ingredients', { id: ing.id, name: ing.name })
        }

        const unitIds = [...new Set(ris.filter((ri) => ri.unitId).map((ri) => ri.unitId!))]
        if (unitIds.length) {
          const units = await db.units.where('id').anyOf(unitIds).toArray()
          for (const unit of units) {
            await upsertRecord('units', { id: unit.id, name: unit.name })
          }
        }
      }
      // Push the recipe (before recipe_ingredients so the relation resolves)
      const r: Recipe = {
        id: recipe.id,
        userId: userId,
        name: recipe.name,
        servings: recipe.servings,
        tagIds: recipe.tagIds || undefined,
        favorite: recipe.favorite,
        instructions: recipe.instructions || undefined,
        notes: recipe.notes || undefined,
        updated: Date.now(),
      }
      await upsertRecord('recipes', r)

      // Push recipe ingredients (after recipe so recipeId relation resolves)
      if (recipe.recipeIngredientIds?.length) {
        const ris = await db.recipe_ingredients
          .where('id')
          .anyOf(recipe.recipeIngredientIds)
          .toArray()

        for (const ri of ris) {
          await upsertRecord('recipe_ingredients', {
            id: ri.id,
            recipeId: ri.recipeId,
            ingredientId: ri.ingredientId,
            quantity: ri.quantity ?? undefined,
            quantityUpper: ri.quantityUpper ?? undefined,
            unitId: ri.unitId ?? undefined,
            quantityUnitPosition: ri.quantityUnitPosition ?? undefined,
            sortOrder: ri.sortOrder,
          })
        }
      }

      if (recipe.deletedRecipeIngredientIds?.length) {
        for (const deletedId of recipe.deletedRecipeIngredientIds) {
          await deleteRecord('recipe_ingredients', deletedId)
        }
      }

      // Mark as synced locally
      await db.recipes.update(recipe.id, {
        synced: true,
        deletedRecipeIngredientIds: [],
      })

      syncStore.setStatus('synced')
    } catch (e) {
      syncStore.setStatus('error')
      errors.push(`${e instanceof Error ? e.name + ': ' + e.message : String(e)}`)
    }
  }

  const allErrors = errors.join(' | ')

  if (errors.length) {
    syncStore.setStatus('error')
    return { success: false, errors: allErrors }
  }
  syncStore.setStatus('synced')
  return { success: true, pushedRecipes: unsyncedRecipes.length }
}

async function pullRemoteData(): Promise<{
  success: boolean
  pulledRecipes?: number
  error?: string
}> {
  if (syncStore.isOffline()) return { success: false, error: 'Offline' }

  const authStore = useAuthStore()

  if (!authStore.isAuth || !authStore.user) {
    syncStore.setStatus('error')
    return { success: false, error: 'Not authenticated' }
  }

  syncStore.setStatus('pulling')

  try {
    // Always pull user settings regardless of whether there are recipes to pull
    if (authStore.user?.id) {
      const remoteSettings = await fetchUserSettings(authStore.user.id)
      if (remoteSettings) useSettingsStore().hydrate(remoteSettings)
    }

    // Fetch user's recipes (PocketBase rules auto-filter by userId)
    const remoteRecipes = await fetchAll('recipes', {
      expand: 'tagIds',
      skipTotal: true,
    })

    // Check if any remote recipes already exist locally as synced
    const localMatches = await db.recipes
      .where('id')
      .anyOf(remoteRecipes.map((r) => r.id))
      .toArray()

    const syncedLocalIds = new Set(localMatches.filter((r) => r.synced).map((r) => r.id))
    const recipesToPull = remoteRecipes.filter((r) => !syncedLocalIds.has(r.id))

    if (!recipesToPull.length) {
      syncStore.setStatus('synced')
      return { success: true, pulledRecipes: 0 }
    }

    // Store tags from expanded data
    for (const recipe of recipesToPull) {
      if (recipe.expand?.tagIds) {
        for (const tag of recipe.expand.tagIds as Tag[]) {
          await db.tags.put({ id: tag.id, name: tag.name })
        }
      }
    }

    // Fetch user's recipe_ingredients
    const conditions = recipesToPull.map((r) => `recipeId = "${r.id}"`).join(' || ')
    const recipeIngredients = await fetchAll('recipe_ingredients', {
      filter: conditions,
      expand: 'ingredientId,unitId',
      skipTotal: true,
    })

    // Store ingredients and units from expanded data, then recipe_ingredients
    for (const ri of recipeIngredients) {
      if (ri.expand?.ingredientId) {
        const ing = ri.expand.ingredientId as Ingredient
        await db.ingredients.put({ id: ing.id, name: ing.name })
      }
      if (ri.expand?.unitId) {
        const unit = ri.expand.unitId as Unit
        await db.units.put({ id: unit.id, name: unit.name })
      }

      await db.recipe_ingredients.put({
        id: ri.id,
        recipeId: ri.recipeId,
        ingredientId: ri.ingredientId,
        quantity: ri.quantity,
        quantityUpper: ri.quantityUpper,
        unitId: ri.unitId,
        quantityUnitPosition: ri.quantityUnitPosition,
        sortOrder: ri.sortOrder,
      })
    }

    // Store recipes in local db
    for (const recipe of recipesToPull) {
      const riIds =
        recipeIngredients.filter((ri) => ri.recipeId === recipe.id).map((ri) => ri.id) || undefined

      const localRecipe: RecipeLocal = {
        id: recipe.id,
        name: recipe.name,
        servings: recipe.servings,
        tagIds: recipe.tagIds || undefined,
        favorite: recipe.favorite,
        recipeIngredientIds: riIds,
        instructions: recipe.instructions || undefined,
        notes: recipe.notes || undefined,
        deletedRecipeIngredientIds: [],
        synced: true,
      }
      await db.recipes.put(localRecipe)
    }

    // Refresh caches
    await tagsManager.cacheAll()
    await unitsManager.cacheAll()

    syncStore.setStatus('synced')
    return { success: true, pulledRecipes: recipesToPull.length }
  } catch (e) {
    syncStore.setStatus('error')
    return { success: false, error: e instanceof Error ? e.message : String(e) }
  }
}

export const sync = {
  init,
  pushLocalChanges,
  pullRemoteData,
}
