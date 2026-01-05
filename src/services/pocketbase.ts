import PocketBase, { LocalAuthStore, ClientResponseError } from 'pocketbase'
import type { RecipeLocal } from '@/types'
import { validators } from './validators'

// Use PocketBase's built-in LocalAuthStore for automatic auth persistence
const pb = new PocketBase(
  import.meta.env.VITE_PB_URL || 'http://127.0.0.1:8090',
  new LocalAuthStore('pb_auth'),
)

// Enable auto-cancellation of duplicate requests
pb.autoCancellation(true)

export async function fetchUserRecipes(userId: string): Promise<RecipeLocal[]> {
  try {
    // Use pb.filter() for safe query construction with parameter escaping
    const records = await pb.collection('recipes').getFullList({
      filter: pb.filter('userId = {:userId}', { userId }),
      // Auto-refresh auth token if needed (30 min threshold)
      autoRefreshThreshold: 1800,
    })

    return records
      .filter((r) => validators.isRecipeValid(r))
      .map((r: any) => ({
        id: r.id,
        userId: r.userId,
        name: r.name,
        tags: r.tags,
        recipeIngredients: r.recipeIngredients,
        instructions: r.instructions,
        notes: r.notes,
        updated: new Date(r.updated).getTime(),
        device_id: r.device_id,
        synced: true,
        pending_sync: false,
        local_only: false,
        conflict_detected: false,
        retry_count: 0,
      }))
  } catch (e: any) {
    if (e instanceof ClientResponseError) {
      console.error('Failed to fetch recipes:', {
        status: e.status,
        message: e.message,
        data: e.response,
      })
      throw new Error(`Fetch failed (${e.status}): ${e.message}`)
    }
    console.error('Failed to fetch recipes:', e)
    throw new Error(`Fetch failed: ${e.message}`)
  }
}

export async function syncRecipe(
  recipe: RecipeLocal,
): Promise<{ success: boolean; data?: RecipeLocal; error?: string }> {
  const errors = validators.validateRecipe(recipe as unknown as Record<string, unknown>)
  if (errors.length > 0) {
    return {
      success: false,
      error: `Validation failed: ${errors.map((e) => e.message).join(', ')}`,
    }
  }

  try {
    if (recipe.local_only) {
      // Create new
      const created = await pb.collection('recipes').create({
        id: recipe.id,
        userId: recipe.userId,
        name: recipe.name,
        tags: recipe.tags,
        recipeIngredients: recipe.recipeIngredients,
        instructions: recipe.instructions,
        notes: recipe.notes,
        updated: new Date().toISOString(),
        device_id: recipe.device_id,
      })
      return {
        success: true,
        data: {
          ...recipe,
          id: created.id,
          updated: new Date(created.updated).getTime(),
          synced: true,
          pending_sync: false,
          local_only: false,
          conflict_detected: false,
          retry_count: 0,
        },
      }
    } else {
      // Update existing
      const updated = await pb.collection('recipes').update(recipe.id, {
        userId: recipe.userId,
        name: recipe.name,
        tags: recipe.tags,
        recipeIngredients: recipe.recipeIngredients,
        instructions: recipe.instructions,
        notes: recipe.notes,
        updated: new Date().toISOString(),
        device_id: recipe.device_id,
      })
      return {
        success: true,
        data: {
          ...recipe,
          updated: new Date(updated.updated).getTime(),
          synced: true,
          pending_sync: false,
          conflict_detected: false,
          retry_count: 0,
        },
      }
    }
  } catch (e: any) {
    return { success: false, error: e.message || 'Sync failed' }
  }
}

export async function deleteRecipe(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    await pb.collection('recipes').delete(id)
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message || 'Delete failed' }
  }
}

/**
 * Sync multiple recipes in a single batch request
 */
export async function syncRecipesBatch(
  recipes: RecipeLocal[],
): Promise<{ success: boolean; results: Array<{ success: boolean; data?: RecipeLocal; error?: string }> }> {
  if (recipes.length === 0) {
    return { success: true, results: [] }
  }

  try {
    const batch = pb.createBatch()

    // Add all recipes to batch
    recipes.forEach((recipe) => {
      if (recipe.local_only) {
        batch.collection('recipes').create({
          id: recipe.id,
          userId: recipe.userId,
          name: recipe.name,
          tags: recipe.tags,
          recipeIngredients: recipe.recipeIngredients,
          instructions: recipe.instructions,
          notes: recipe.notes,
          updated: new Date().toISOString(),
          device_id: recipe.device_id,
        })
      } else {
        batch.collection('recipes').update(recipe.id, {
          userId: recipe.userId,
          name: recipe.name,
          tags: recipe.tags,
          recipeIngredients: recipe.recipeIngredients,
          instructions: recipe.instructions,
          notes: recipe.notes,
          updated: new Date().toISOString(),
          device_id: recipe.device_id,
        })
      }
    })

    // Send batch request
    const batchResults = await batch.send({ autoRefreshThreshold: 1800 })

    // Process results
    const results: Array<{ success: boolean; data?: RecipeLocal; error?: string }> = batchResults.map((result, index) => {
      if (result.status >= 200 && result.status < 300) {
        const recipe = recipes[index]!
        const updatedAt = new Date(result.body.updated).getTime()
        return {
          success: true,
          data: {
            ...recipe,
            updated: updatedAt,
            device_id: recipe.device_id || '',
            synced: true,
            pending_sync: false,
            local_only: false,
            conflict_detected: false,
            retry_count: 0,
          } as RecipeLocal,
        }
      } else {
        return {
          success: false,
          error: result.body?.message || `Batch sync failed with status ${result.status}`,
        }
      }
    })

    return { success: true, results }
  } catch (e) {
    if (e instanceof ClientResponseError) {
      return {
        success: false,
        results: recipes.map(() => ({
          success: false,
          error: `Batch failed (${e.status}): ${e.message}`,
        })),
      }
    }
    return {
      success: false,
      results: recipes.map(() => ({ success: false, error: e instanceof Error ? e.message : 'Batch sync failed' })),
    }
  }
}

export { pb, ClientResponseError }
