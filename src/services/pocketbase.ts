import PocketBase, { LocalAuthStore, ClientResponseError, type RecordModel } from 'pocketbase'
import { generateUuid } from '@/utils/uuid'
import errorTranslationHandler from '@/utils/errorTranslationHandler'
import type { RecipeLocal } from '@/types'

const pb = new PocketBase(import.meta.env.VITE_PB_URL, new LocalAuthStore('rcps.app_auth'))

pb.autoCancellation(true)

export async function registerUser(
  email: string,
  password: string,
  passwordConfirm: string,
  locale: string,
) {
  try {
    await pb.collection('users').create({
      id: generateUuid(),
      email: email,
      password: password,
      passwordConfirm: passwordConfirm,
      locale: locale,
    })
    return { success: true }
  } catch (e: unknown) {
    return { success: false, error: errorTranslationHandler(e) }
  }
}

export async function verifyEmail(token: string) {
  try {
    await pb.collection('users').confirmVerification(token)
    return { success: true }
  } catch (e: unknown) {
    return { success: false, error: errorTranslationHandler(e) }
  }
}

export async function loginUser(email: string, password: string) {
  try {
    await pb.collection('users').authWithPassword(email, password)
    return { success: true }
  } catch (e: unknown) {
    return { success: false, error: errorTranslationHandler(e) }
  }
}

export async function logoutUser(): Promise<void> {
  pb.authStore.clear()
}

export async function fetchUserRecipes(userId: string): Promise<RecipeLocal[]> {
  try {
    const records = await pb.collection('recipes').getFullList({
      filter: pb.filter('userId = {:userId}', { userId }),
      // Auto-refresh auth token if needed (30 min threshold)
      autoRefreshThreshold: 1800,
    })

    return records.map((r: RecordModel) => ({
      id: r.id,
      userId: r.userId,
      name: r.name,
      tags: r.tags,
      recipeIngredients: r.recipeIngredients,
      instructions: r.instructions,
      notes: r.notes,
      updated: new Date(r.updated).getTime(),
      deviceId: r.deviceId,
      synced: true,
      pendingSync: false,
      localOnly: false,
    }))
  } catch (e: unknown) {
    if (e instanceof ClientResponseError) {
      console.error('Failed to fetch recipes:', {
        status: e.status,
        message: e.message,
        data: e.response,
      })
      throw new Error(`Fetch failed (${e.status}): ${e.message}`)
    }
    console.error('Failed to fetch recipes:', e)
    const msg = e instanceof Error ? e.message : String(e)
    throw new Error(`Fetch failed: ${msg}`)
  }
}

export async function syncRecipe(
  recipe: RecipeLocal,
): Promise<{ success: boolean; data?: RecipeLocal; error?: string }> {
  try {
    if (recipe.localOnly) {
      const created = await pb.collection('recipes').create({
        id: recipe.id,
        userId: recipe.userId,
        name: recipe.name,
        tags: recipe.tags,
        recipeIngredients: recipe.recipeIngredients,
        instructions: recipe.instructions,
        notes: recipe.notes,
        updated: new Date().toISOString(),
        deviceId: recipe.deviceId,
      })
      return {
        success: true,
        data: {
          ...recipe,
          id: created.id,
          updated: new Date(created.updated).getTime(),
          synced: true,
          pendingSync: false,
          localOnly: false,
        },
      }
    } else {
      const updated = await pb.collection('recipes').update(recipe.id, {
        userId: recipe.userId,
        name: recipe.name,
        tagIds: recipe.tagIds,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
        notes: recipe.notes,
        updated: new Date().toISOString(),
        deviceId: recipe.deviceId,
      })
      return {
        success: true,
        data: {
          ...recipe,
          updated: new Date(updated.updated).getTime(),
          synced: true,
          pendingSync: false,
        },
      }
    }
  } catch (e: unknown) {
    if (e instanceof ClientResponseError) {
      return { success: false, error: `${e.status}: ${e.message}` }
    }
    const msg = e instanceof Error ? e.message : 'Sync failed'
    return { success: false, error: msg }
  }
}

export async function deleteRecipe(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    await pb.collection('recipes').delete(id)
    return { success: true }
  } catch (e: unknown) {
    if (e instanceof ClientResponseError) {
      return { success: false, error: `${e.status}: ${e.message}` }
    }
    const msg = e instanceof Error ? e.message : 'Delete failed'
    return { success: false, error: msg }
  }
}

export { pb, ClientResponseError }
