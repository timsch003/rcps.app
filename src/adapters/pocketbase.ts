import PocketBase, { LocalAuthStore, ClientResponseError } from 'pocketbase'
import { v7 as uuidv7 } from 'uuid'
import translateError from '@/utils/pb_error_translation'
import type { IdAndName, Recipe, RecipeIngredient } from '@/types'

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

export async function logoutUser(): Promise<void> {
  pb.authStore.clear()
}

export function getUserId(): string | undefined {
  return pb.authStore.record?.id
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

export { pb, ClientResponseError }
