import PocketBase, { LocalAuthStore, ClientResponseError } from 'pocketbase'
import { v7 as uuidv7 } from 'uuid'
import translateError from '@/utils/pb_error_translation'
import type { IdAndName, Recipe, RecipeIngredient, UserSettings } from '@/types'

const pb = new PocketBase(import.meta.env.VITE_PB_URL, new LocalAuthStore('rcps-app-auth'))

pb.autoCancellation(true)

export async function registerUser(
  email: string,
  password: string,
  passwordConfirm: string,
  locale: string,
) {
  try {
    await pb.collection('users').create({
      id: uuidv7(),
      email: email,
      password: password,
      passwordConfirm: passwordConfirm,
      locale: locale,
    })
    return { success: true }
  } catch (e: unknown) {
    return { success: false, error: translateError(e) }
  }
}

export async function verifyEmail(token: string) {
  try {
    await pb.collection('users').confirmVerification(token)
    return { success: true }
  } catch (e: unknown) {
    return { success: false, error: translateError(e) }
  }
}

export async function loginUser(email: string, password: string) {
  try {
    await pb.collection('users').authWithPassword(email, password)
    return { success: true }
  } catch (e: unknown) {
    return { success: false, error: translateError(e) }
  }
}

export function logoutUser(): void {
  pb.authStore.clear()
}

export async function updateUserSettings(userId: string, settings: UserSettings): Promise<void> {
  if (!userId) return

  try {
    await pb.collection('users').update(userId, { settings: { ...settings } })
  } catch (e) {
    if (e) throw e
  }
}

export async function fetchUserSettings(userId: string): Promise<UserSettings | null> {
  if (!userId) return null

  try {
    const userData = await pb.collection('users').getOne(userId)

    return userData.settings as UserSettings
  } catch (e) {
    if (e) throw e
    return null
  }
}

export async function upsertRecord(
  collection: string,
  data: IdAndName | Recipe | RecipeIngredient,
): Promise<void> {
  try {
    // Only PocketBase records method that doesn't throw an error
    // on missing record, so it seems like the best way to check existence:
    const existingRecord = await pb.collection(collection).getList(1, 1, {
      filter: `id = "${data.id}"`,
    })

    if (existingRecord.items.length) {
      if (!(collection === 'recipes' || collection === 'recipe_ingredients')) return

      const dataWithoutId: Partial<IdAndName | Recipe | RecipeIngredient> = { ...data }
      delete dataWithoutId.id
      await pb.collection(collection).update(data.id, dataWithoutId)
    } else {
      await pb.collection(collection).create(data)
    }
  } catch (e) {
    if (e) throw e
  }
}

export async function fetchAll(collection: string, options?: Record<string, unknown>) {
  return await pb.collection(collection).getFullList({ ...options })
}

// Only for testing purposes, not used in the app
export async function resetTestData(): Promise<void> {
  await pb.collection('_superusers').authWithPassword('superuser@example.com', 'password')
  await pb.collections.truncate('recipes')
  await pb.collections.truncate('recipe_ingredients')
  await pb.collections.truncate('ingredients')
  await pb.collections.truncate('tags')
  await pb.collections.truncate('units')
  await pb.authStore.clear()
}

export { pb, ClientResponseError }
