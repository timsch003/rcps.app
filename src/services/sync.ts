import { db } from '@/adapters/dexie'
import { getUserId, upsertRecord, fetchFullList } from '@/adapters/pocketbase'
import { useAuthStore } from '@/stores/auth'
import { tagsManager } from './tags_manager'
import { unitsManager } from './units_manager'
import type { RecipeLocal } from '@/types'

interface PbRecipeIngredient {
  id: string
  recipeId: string
  ingredientId: string
  quantity?: number
  quantityUpper?: number
  unitId?: string
  quantityUnitPosition?: number
  sortOrder: number
  expand?: {
    ingredientId?: { id: string; name: string }
    unitId?: { id: string; name: string }
  }
}

async function pushLocalChanges(): Promise<{
  success: boolean
  pushedRecipes?: number
  errors?: string
}> {
  const authStore = useAuthStore()
  if (!authStore.isAuth || !authStore.user) {
    return { success: false, errors: 'Not authenticated' }
  }

  const userId = getUserId()
  if (!userId) return { success: false, errors: 'No user ID' }

  const unsyncedRecipes = await db.recipes.filter((r) => !r.synced).toArray()
  if (unsyncedRecipes.length === 0) return { success: true, pushedRecipes: 0 }

  const errors: string[] = []

  for (const recipe of unsyncedRecipes) {
    try {
      // 1. Push tags referenced by this recipe
      if (recipe.tagIds?.length) {
        const tags = await db.tags.where('id').anyOf(recipe.tagIds).toArray()
        for (const tag of tags) {
          await upsertRecord('tags', { id: tag.id, name: tag.name })
        }
      }

      // 2. Push ingredients and units referenced by recipe ingredients
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

      // 3. Push the recipe (before recipe_ingredients so the relation resolves)
      await upsertRecord('recipes', {
        id: recipe.id,
        userId: userId,
        name: recipe.name,
        tagIds: recipe.tagIds || [],
        servings: recipe.servings,
        instructions: recipe.instructions || '',
        notes: recipe.notes || '',
        updated: Date.now(),
      })

      // 4. Push recipe ingredients (after recipe so recipeId relation resolves)
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

      // 5. Mark as synced locally
      await db.recipes.update(recipe.id, { synced: true })
    } catch (e) {
      errors.push(`${e instanceof Error ? e.name + ': ' + e.message : String(e)}`)
    }
  }

  const allErrors = errors.join(' | ')

  if (errors.length) {
    return { success: false, errors: allErrors }
  }
  return { success: true, pushedRecipes: unsyncedRecipes.length }
}

async function pullRemoteData(): Promise<{
  success: boolean
  pulledRecipes?: number
  error?: string
}> {
  const authStore = useAuthStore()
  if (!authStore.isAuth || !authStore.user) {
    return { success: false, error: 'Not authenticated' }
  }

  try {
    // 1. Fetch all user recipes (PB rules auto-filter by userId)
    const remoteRecipes = await fetchFullList('recipes', { expand: 'tagIds' })
    if (!remoteRecipes.length) return { success: true, pulledRecipes: 0 }

    // 2. Store tags from expanded data
    for (const recipe of remoteRecipes) {
      if (recipe.expand?.tagIds) {
        for (const tag of recipe.expand.tagIds as { id: string; name: string }[]) {
          await db.tags.put({ id: tag.id, name: tag.name })
        }
      }
    }

    // 3. Fetch recipe_ingredients in batches
    const recipeIds = remoteRecipes.map((r) => r.id as string)
    const allRecipeIngredients: PbRecipeIngredient[] = []
    const batchSize = 50

    for (let i = 0; i < recipeIds.length; i += batchSize) {
      const batch = recipeIds.slice(i, i + batchSize)
      const filter = batch.map((id) => `recipeId = "${id}"`).join(' || ')
      const ris = (await fetchFullList('recipe_ingredients', {
        filter,
        expand: 'ingredientId,unitId',
      })) as unknown as PbRecipeIngredient[]
      allRecipeIngredients.push(...ris)
    }

    // 4. Store ingredients and units from expanded data, then recipe_ingredients
    for (const ri of allRecipeIngredients) {
      if (ri.expand?.ingredientId) {
        const ing = ri.expand.ingredientId as { id: string; name: string }
        await db.ingredients.put({ id: ing.id, name: ing.name })
      }
      if (ri.expand?.unitId) {
        const unit = ri.expand.unitId as { id: string; name: string }
        await db.units.put({ id: unit.id, name: unit.name })
      }

      await db.recipe_ingredients.put({
        id: ri.id,
        recipeId: ri.recipeId,
        ingredientId: ri.ingredientId,
        quantity: ri.quantity || undefined,
        quantityUpper: ri.quantityUpper || undefined,
        unitId: ri.unitId || undefined,
        quantityUnitPosition: ri.quantityUnitPosition || undefined,
        sortOrder: ri.sortOrder || 0,
      })
    }

    // 5. Build recipeIngredientIds lookup
    const risByRecipe = new Map<string, string[]>()
    for (const ri of allRecipeIngredients) {
      if (!risByRecipe.has(ri.recipeId)) risByRecipe.set(ri.recipeId, [])
      risByRecipe.get(ri.recipeId)!.push(ri.id)
    }

    // 6. Store recipes in Dexie (skip unsynced local recipes to preserve local changes)
    for (const recipe of remoteRecipes) {
      const existingLocal = await db.recipes.get(recipe.id)
      if (existingLocal && !existingLocal.synced) continue

      const localRecipe: RecipeLocal = {
        id: recipe.id,
        name: recipe.name,
        servings: recipe.servings,
        tagIds: recipe.tagIds || [],
        recipeIngredientIds: risByRecipe.get(recipe.id) || [],
        instructions: recipe.instructions || undefined,
        notes: recipe.notes || undefined,
        synced: true,
      }
      await db.recipes.put(localRecipe)
    }

    // 7. Refresh caches
    await tagsManager.cacheAll()
    await unitsManager.cacheAll()

    console.log(remoteRecipes)

    return { success: true, pulledRecipes: remoteRecipes.length }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : String(e) }
  }
}

export const sync = {
  pushLocalChanges,
  pullRemoteData,
}
