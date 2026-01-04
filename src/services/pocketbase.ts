import PocketBase from 'pocketbase'
import type { RecipeLocal, ValidationError } from '@/types'
import { recipeValidator } from './dexie'

const pb = new PocketBase(import.meta.env.PB_URL || 'http://127.0.0.1:8090')

// Input validation
export const pbValidator = {
  validateEmail(email: string): ValidationError[] {
    const errors: ValidationError[] = []
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!email || !emailRegex.test(email)) {
      errors.push({ field: 'email', message: 'Valid email is required', value: email })
    }

    return errors
  },

  validatePassword(password: string): ValidationError[] {
    const errors: ValidationError[] = []

    if (!password || password.length < 8) {
      errors.push({
        field: 'password',
        message: 'Password must be at least 8 characters',
        value: '',
      })
    }

    if (!/[A-Z]/.test(password)) {
      errors.push({
        field: 'password',
        message: 'Password must contain an uppercase letter',
        value: '',
      })
    }

    if (!/[a-z]/.test(password)) {
      errors.push({
        field: 'password',
        message: 'Password must contain a lowercase letter',
        value: '',
      })
    }

    if (!/[0-9]/.test(password)) {
      errors.push({ field: 'password', message: 'Password must contain a number', value: '' })
    }

    return errors
  },
}

export async function registerUser(
  email: string,
  password: string,
  userId: string,
): Promise<{ success: boolean; errors: ValidationError[] }> {
  const emailErrors = pbValidator.validateEmail(email)
  const passwordErrors = pbValidator.validatePassword(password)
  const allErrors = [...emailErrors, ...passwordErrors]

  if (allErrors.length > 0) {
    return { success: false, errors: allErrors }
  }

  try {
    await pb.collection('users').create({
      email,
      password,
      passwordConfirm: password,
      userId,
      confirmed_email: false,
    })
    return { success: true, errors: [] }
  } catch (e: any) {
    return {
      success: false,
      errors: [{ field: 'registration', message: e.message || 'Registration failed', value: null }],
    }
  }
}

export async function loginUser(
  email: string,
  password: string,
): Promise<{ success: boolean; error?: string; user?: any }> {
  try {
    const authData = await pb.collection('users').authWithPassword(email, password)
    return { success: true, user: authData.record }
  } catch (e: any) {
    return { success: false, error: e.message || 'Login failed' }
  }
}

export async function logoutUser(): Promise<void> {
  pb.authStore.clear()
}

export function getCurrentUser(): any {
  return pb.authStore.model
}

export function isAuthenticated(): boolean {
  return pb.authStore.isValid
}

export async function fetchUserRecipes(userId: string): Promise<RecipeLocal[]> {
  try {
    const records = await pb.collection('recipes').getFullList({
      filter: `userId = "${userId}"`,
    })

    return records
      .filter((r) => recipeValidator.isValid(r))
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
    console.error('Failed to fetch recipes:', e)
    throw new Error(`Fetch failed: ${e.message}`)
  }
}

export async function syncRecipe(
  recipe: RecipeLocal,
): Promise<{ success: boolean; data?: RecipeLocal; error?: string }> {
  const errors = recipeValidator.validate(recipe)
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

export function isOnline(): boolean {
  return navigator.onLine
}

export { pb }
