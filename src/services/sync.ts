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
import { recipesManager } from './recipes_manager'
import type { RecipeLocal, Ingredient, Tag, Unit, Recipe } from '@/types'

// Prevent racing conditions on first sync at app startup
function getSyncStore() {
  return useSyncStore()
}

async function trigger(): Promise<void> {
  const push = await pushLocalChanges()
  if (push) console.log('Sync: push results', push)
  const pull = await pullRemoteData()
  if (pull) console.log('Sync: pull results', pull)
}

function checkRequirements(
  unsyncedRecipes: RecipeLocal[] | undefined,
  userId: string | undefined = useAuthStore().user?.id,
): {
  success: boolean
  errors?: string
} {
  const syncStore = getSyncStore()
  const settingsStore = useSettingsStore()
  const authStore = useAuthStore()

  if (settingsStore.hasLocalChanges || unsyncedRecipes?.length) {
    if (syncStore.isOffline()) {
      syncStore.setStatus('unsynced-offline')
      return { success: false, errors: 'Offline with unsynced local changes' }
    }

    syncStore.setStatus('unsynced')
  }

  if (syncStore.isOffline()) return { success: false, errors: 'Offline' }

  if (!authStore.isAuth || !authStore.user) {
    syncStore.setStatus('error')
    return { success: false, errors: 'Not authenticated' }
  }

  if (!userId) {
    syncStore.setStatus('error')
    return { success: false, errors: 'No user ID' }
  }

  return { success: true }
}

async function pushLocalChanges(): Promise<{
  success: boolean
  pushedRecipes?: number
  deletedRecipes?: number
  errors?: string
}> {
  const syncStore = getSyncStore()
  const settingsStore = useSettingsStore()
  const authStore = useAuthStore()
  const userId = authStore.user?.id
  const unsyncedRecipes = await db.recipes.filter((r) => !r.synced).toArray()
  let deletedRecipesCount = 0

  const result = checkRequirements(unsyncedRecipes, userId)
  if (!result.success) return { success: false, errors: result.errors }

  // Always push user settings regardless of whether there are recipes to push
  if (settingsStore.hasLocalChanges) {
    syncStore.setStatus('pushing')
    await updateUserSettings(userId!, { ...settingsStore.settings })
    settingsStore.markSettingsSynced()
    console.log('Sync: user settings pushed')
  } else {
    console.log('Sync: no local user settings changes to push')
  }

  // Gather unsynced recipes to push
  if (unsyncedRecipes.length <= 0) {
    syncStore.setStatus('synced')
    return { success: false, errors: 'No local recipe changes to sync' }
  }

  syncStore.setStatus('pushing')

  const errors: string[] = []

  for (const recipe of unsyncedRecipes) {
    try {
      if (recipe.deleted) {
        if (recipe.recipeIngredientIds?.length) {
          for (const recipeIngredientId of recipe.recipeIngredientIds) {
            await deleteRecord('recipe_ingredients', recipeIngredientId)
          }
        }

        await deleteRecord('recipes', recipe.id)
        await db.recipes.delete(recipe.id)
        recipesManager.removeRecipeFromCache(recipe.id)
        deletedRecipesCount++
        continue
      }

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
        userId: userId!,
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
        deleted: false,
      })

      syncStore.setStatus('synced')
    } catch (e) {
      syncStore.setStatus('error')
      errors.push(String(e))
    }
  }

  const allErrors = errors.join(' | ')

  if (errors.length) {
    syncStore.setStatus('error')
    return { success: false, errors: allErrors }
  }
  syncStore.setStatus('synced')
  return {
    success: true,
    pushedRecipes: unsyncedRecipes.length - deletedRecipesCount,
    deletedRecipes: deletedRecipesCount,
  }
}

async function pullRemoteData(): Promise<{
  success: boolean
  pulledRecipes?: number
  deletedRecipes?: number
  error?: string
}> {
  const syncStore = getSyncStore()
  const authStore = useAuthStore()
  const userId = authStore.user?.id
  let deletedRecipesCount = 0

  const result = checkRequirements(undefined, userId)
  if (!result.success) return { success: false, error: result.errors }

  syncStore.setStatus('pulling')

  try {
    // Always pull user settings regardless of whether there are recipes to pull
    if (userId) {
      const remoteSettings = await fetchUserSettings(userId)
      if (remoteSettings) useSettingsStore().hydrate(remoteSettings)
    }

    // Fetch user's recipes (PocketBase rules auto-filter by userId)
    const remoteRecipes = await fetchAll('recipes', {
      expand: 'tagIds',
      skipTotal: true,
    })

    const localRecipes = await db.recipes.toArray()
    const localIds = new Set(localRecipes.map((recipe) => recipe.id))
    const remoteIds = new Set(remoteRecipes.map((recipe) => recipe.id))

    // Remove local recipes that used to be synced but are no longer present on the server.
    const deletedRemotely = localRecipes.filter(
      (recipe) => recipe.synced && !recipe.deleted && !remoteIds.has(recipe.id),
    )

    for (const recipe of deletedRemotely) {
      const recipeTagIds = recipe.tagIds || []
      if (recipe.recipeIngredientIds?.length) {
        await db.recipe_ingredients.bulkDelete(recipe.recipeIngredientIds)
      }
      await db.recipes.delete(recipe.id)
      await tagsManager.removeOrphanedFromLocal(recipeTagIds)
      recipesManager.removeRecipeFromCache(recipe.id)
      deletedRecipesCount++
    }

    // Pull only recipes that are not present locally at all.
    const recipesToPull = remoteRecipes.filter((recipe) => !localIds.has(recipe.id))

    if (!recipesToPull.length) {
      syncStore.setStatus('synced')
      return {
        success: deletedRemotely.length > 0,
        pulledRecipes: 0,
        error: deletedRemotely.length > 0 ? undefined : 'No remote recipe changes to pull',
      }
    }

    // Store tags from expanded data
    for (const recipe of recipesToPull) {
      if (recipe.expand?.tagIds) {
        for (const tag of recipe.expand.tagIds as Tag[]) {
          await db.tags.put({ id: tag.id, name: tag.name })
        }
      }
    }

    // Fetch user's recipeIngredients
    const conditions = recipesToPull.map((r) => `recipeId = "${r.id}"`).join(' || ')
    const recipeIngredients = await fetchAll('recipe_ingredients', {
      filter: conditions,
      expand: 'ingredientId,unitId',
      skipTotal: true,
    })

    // Store ingredients and units from expanded data, then recipeIngredients
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
        deleted: false,
      }
      await db.recipes.put(localRecipe)
    }

    // Refresh caches
    await tagsManager.cacheAll()
    await unitsManager.cacheAll()

    syncStore.setStatus('synced')
    return {
      success: true,
      pulledRecipes: recipesToPull.length - deletedRecipesCount,
      deletedRecipes: deletedRecipesCount,
    }
  } catch (e) {
    syncStore.setStatus('error')
    return { success: false, error: String(e) }
  }
}

export const sync = {
  trigger,
}
