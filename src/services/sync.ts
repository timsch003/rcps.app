import { db } from '@/adapters/dexie'
import {
  upsertRecord,
  deleteRecord,
  fetchAll,
  updateUserSettings,
  fetchUserSettings,
  updateLastViewed,
  fetchLastViewed,
} from '@/adapters/pocketbase'
import { useSyncStore } from '@/stores/sync_status'
import { useAuthStore } from '@/stores/auth'
import { useSettingsStore } from '@/stores/settings'
import { useLastViewedStore } from '@/stores/last_viewed'
import { recipesManager } from './recipes_manager'
import { tagsManager } from './tags_manager'
import { ingredientsManager } from './ingredients_manager'
import { unitsManager } from './units_manager'
import type { RecipeLocal, Ingredient, Tag, Unit, Recipe, RecipeIngredient } from '@/types'

// Prevent racing conditions on first sync at app startup
function getSyncStore() {
  return useSyncStore()
}

async function trigger(pullOnly: boolean = false): Promise<void> {
  if (!pullOnly) {
    const push = await pushLocalChanges()
    if (push) console.log('Sync: push results ', push)
  }
  const pull = await pullRemoteData()
  if (pull) console.log('Sync: pull results ', pull)
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
  success?: boolean
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
  const remoteTagIdByLocalId = new Map<string, string>()
  const remoteIngredientIdByLocalId = new Map<string, string>()
  const remoteUnitIdByLocalId = new Map<string, string>()

  const errors: string[] = []

  try {
    const result = checkRequirements(unsyncedRecipes, userId)
    if (!result.success) return { success: false, errors: result.errors }

    // Always push user settings regardless of whether there are recipes to push
    if (settingsStore.hasLocalChanges) {
      syncStore.setStatus('pushing')
      await updateUserSettings(userId!, { ...settingsStore.getStoredSettings() })
      settingsStore.markSettingsSynced()
      console.log('Sync: user settings pushed ', settingsStore.getStoredSettings())
    } else {
      console.log('Sync: no local user settings changes to push')
    }

    // Always push lastViewed map
    const lastViewedStore = useLastViewedStore()
    const map = lastViewedStore.getMap()
    if (Object.keys(map).length) {
      await updateLastViewed(userId!, map)
      console.log('Sync: lastViewed map pushed ', map)
    } else {
      console.log('Sync: no local lastViewed changes to push')
    }

    // Gather unsynced recipes to push
    if (unsyncedRecipes.length <= 0) {
      syncStore.setStatus('synced')
      return { pushedRecipes: 0 }
    }

    syncStore.setStatus('pushing')

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
        const remoteTagIds: string[] = []
        if (recipe.tagIds?.length) {
          const tags = await db.tags.where('id').anyOf(recipe.tagIds).toArray()
          for (const tag of tags) {
            const remoteTagId =
              remoteTagIdByLocalId.get(tag.id) ?? (await upsertRecord('tags', tag)) ?? tag.id
            remoteTagIdByLocalId.set(tag.id, remoteTagId)
            remoteTagIds.push(remoteTagId)
          }
        }

        // Push ingredients and units referenced by recipe ingredients
        let recipeIngredientsForPush: RecipeIngredient[] = []
        if (recipe.recipeIngredientIds?.length) {
          const ris = await db.recipe_ingredients
            .where('id')
            .anyOf(recipe.recipeIngredientIds)
            .toArray()
          recipeIngredientsForPush = ris

          const ingredientIds = [...new Set(ris.map((ri) => ri.ingredientId))]
          const ingredients = await db.ingredients.where('id').anyOf(ingredientIds).toArray()
          for (const ing of ingredients) {
            const remoteIngredientId =
              remoteIngredientIdByLocalId.get(ing.id) ??
              (await upsertRecord('ingredients', ing)) ??
              ing.id
            remoteIngredientIdByLocalId.set(ing.id, remoteIngredientId)
          }

          const unitIds = [...new Set(ris.filter((ri) => ri.unitId).map((ri) => ri.unitId!))]
          if (unitIds.length) {
            const units = await db.units.where('id').anyOf(unitIds).toArray()
            for (const unit of units) {
              const remoteUnitId =
                remoteUnitIdByLocalId.get(unit.id) ?? (await upsertRecord('units', unit)) ?? unit.id
              remoteUnitIdByLocalId.set(unit.id, remoteUnitId)
            }
          }
        }
        // Push the recipe (before recipe_ingredients so the relation resolves)
        const r: Recipe = {
          id: recipe.id,
          userId: userId!,
          name: recipe.name,
          servings: recipe.servings,
          tagIds: remoteTagIds,
          favorite: recipe.favorite,
          instructions: recipe.instructions || undefined,
          notes: recipe.notes || undefined,
          updated: Date.now(),
        }
        await upsertRecord('recipes', r)

        // Push recipe ingredients (after recipe so recipeId relation resolves)
        if (recipeIngredientsForPush.length) {
          for (const ri of recipeIngredientsForPush) {
            await upsertRecord('recipe_ingredients', {
              id: ri.id,
              recipeId: ri.recipeId,
              ingredientId: remoteIngredientIdByLocalId.get(ri.ingredientId) ?? ri.ingredientId,
              quantity: ri.quantity ?? undefined,
              quantityUpper: ri.quantityUpper ?? undefined,
              unitId: ri.unitId ? (remoteUnitIdByLocalId.get(ri.unitId) ?? ri.unitId) : undefined,
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
      } catch (e) {
        errors.push(String(e))
      }
    }
  } catch (e) {
    errors.push(String(e))
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
  success?: boolean
  pulledRecipes?: number
  deletedRecipes?: number
  error?: string
}> {
  const syncStore = getSyncStore()
  const authStore = useAuthStore()
  const userId = authStore.user?.id
  let deletedRecipesCount = 0

  syncStore.setStatus('pulling')

  try {
    // Always pull user settings regardless of whether there are recipes to pull
    if (userId) {
      const remoteSettings = await fetchUserSettings(userId)
      if (remoteSettings) {
        const changes = useSettingsStore().hydrate(remoteSettings)
        if (changes) {
          console.log(
            'Sync: remote user settings merged into local.\nBefore: ',
            changes.before,
            '\nAfter: ',
            changes.after,
          )
        } else {
          console.log('Sync: no remote user settings changes to pull')
        }
      }

      // Pull and merge lastViewed map (LWW per entry)
      const remoteLastViewed = await fetchLastViewed(userId)
      if (remoteLastViewed) {
        const { changes, merged } = useLastViewedStore().merge(remoteLastViewed)
        if (changes) {
          console.log('Sync: lastViewed map merged from remote ', merged)
        } else {
          console.log('Sync: no remote lastViewed changes to pull')
        }
      }
    }

    const remoteTagIdToLocalId = new Map<string, string>()
    const remoteIngredientIdToLocalId = new Map<string, string>()
    const remoteUnitIdToLocalId = new Map<string, string>()

    // Fetch user's recipes (PocketBase rules auto-filter by userId)
    const remoteRecipes = await fetchAll('recipes', {
      expand: 'tagIds',
      skipTotal: true,
    })

    const localRecipes = await db.recipes.toArray()
    const localIds = new Set(localRecipes.map((recipe) => recipe.id))
    const localMap = new Map(localRecipes.map((r) => [r.id, r]))
    const remoteIds = new Set(remoteRecipes.map((recipe) => recipe.id))

    // Remove local recipes that used to be synced but are no longer present on the server
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

    // Pull recipes that are new OR where the remote version is newer (LWW by updated timestamp)
    const recipesToProcess = remoteRecipes.filter((remote) => {
      if (!localIds.has(remote.id)) return true
      const local = localMap.get(remote.id)!
      return (remote.updated ?? 0) > (local.updated ?? 0)
    })

    if (!recipesToProcess.length) {
      await recipesManager.updateLastViewedCache()
      syncStore.setStatus('synced')
      return {
        pulledRecipes: 0,
      }
    }

    // Store tags from expanded data
    for (const recipe of recipesToProcess) {
      if (recipe.expand?.tagIds) {
        for (const tag of recipe.expand.tagIds as Tag[]) {
          const localTagId = (await tagsManager.addOrGetExisting(tag.name)) ?? tag.id
          remoteTagIdToLocalId.set(tag.id, localTagId)
        }
      }
    }

    // Fetch user's recipeIngredients
    const conditions = recipesToProcess.map((r) => `recipeId = "${r.id}"`).join(' || ')
    const recipeIngredients = await fetchAll('recipe_ingredients', {
      filter: conditions,
      expand: 'ingredientId,unitId',
      skipTotal: true,
    })

    // Store ingredients and units from expanded data, then recipeIngredients
    for (const ri of recipeIngredients) {
      if (ri.expand?.ingredientId) {
        const ing = ri.expand.ingredientId as Ingredient
        const localIngredientId = await ingredientsManager.addOrGetExisting(ing.name)
        remoteIngredientIdToLocalId.set(ing.id, localIngredientId)
      }
      if (ri.expand?.unitId) {
        const unit = ri.expand.unitId as Unit
        const localUnitId = (await unitsManager.addOrGetExisting(unit.name)) ?? unit.id
        remoteUnitIdToLocalId.set(unit.id, localUnitId)
      }

      await db.recipe_ingredients.put({
        id: ri.id,
        recipeId: ri.recipeId,
        ingredientId: remoteIngredientIdToLocalId.get(ri.ingredientId) ?? ri.ingredientId,
        quantity: ri.quantity,
        quantityUpper: ri.quantityUpper,
        unitId: ri.unitId ? (remoteUnitIdToLocalId.get(ri.unitId) ?? ri.unitId) : undefined,
        quantityUnitPosition: ri.quantityUnitPosition,
        sortOrder: ri.sortOrder,
      })
    }

    // Store recipes in local db
    for (const recipe of recipesToProcess) {
      const isUpdate = localIds.has(recipe.id)
      const riIds =
        recipeIngredients.filter((ri) => ri.recipeId === recipe.id).map((ri) => ri.id) || undefined

      // For updated recipes, remove stale recipe_ingredients first
      if (isUpdate) {
        const oldLocal = localMap.get(recipe.id)!
        if (oldLocal.recipeIngredientIds?.length) {
          await db.recipe_ingredients.bulkDelete(oldLocal.recipeIngredientIds)
        }
      }

      const localRecipe: RecipeLocal = {
        id: recipe.id,
        name: recipe.name,
        servings: recipe.servings,
        tagIds: recipe.tagIds.map((tagId: string) => remoteTagIdToLocalId.get(tagId) ?? tagId),
        favorite: recipe.favorite,
        recipeIngredientIds: riIds,
        instructions: recipe.instructions || undefined,
        notes: recipe.notes || undefined,
        updated: recipe.updated,
        deletedRecipeIngredientIds: [],
        synced: true,
        deleted: false,
      }
      await db.recipes.put(localRecipe)
    }

    // Refresh caches
    await tagsManager.cacheAll()
    await unitsManager.cacheAll()
    await recipesManager.updateLastViewedCache()

    syncStore.setStatus('synced')
    return {
      success: true,
      pulledRecipes: recipesToProcess.length - deletedRecipesCount,
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
