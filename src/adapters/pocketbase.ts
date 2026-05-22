import PocketBase, { LocalAuthStore, ClientResponseError } from 'pocketbase'
import { v7 as uuidv7 } from 'uuid'
import translateError from '@/utils/pb_error_translation'
import { PB_AUTH_STORAGE_KEY, SHARED_NAME_COLLECTIONS } from '@/constants'
import { normalizeName } from '@/utils/normalize_name'
import type { IdAndName, LastViewedMap, Recipe, RecipeIngredient, UserSettings } from '@/types'

const pb = new PocketBase(import.meta.env.VITE_PB_URL, new LocalAuthStore(PB_AUTH_STORAGE_KEY))

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

export async function updateUserSettings(
  userId: string,
  settings: Partial<UserSettings>,
): Promise<void> {
  if (!userId) return

  try {
    await pb.collection('users').update(userId, { settings: { ...settings } })
  } catch (e) {
    if (e) throw e
  }
}

export async function fetchUserSettings(userId: string): Promise<Partial<UserSettings> | null> {
  if (!userId) return null

  try {
    const userData = await pb.collection('users').getOne(userId)

    return userData.settings as UserSettings
  } catch (e) {
    if (e) throw e
    return null
  }
}

export async function updateLastViewed(userId: string, map: LastViewedMap): Promise<void> {
  if (!userId) return

  try {
    await pb.collection('users').update(userId, { lastViewed: { ...map } })
  } catch (e) {
    if (e) throw e
  }
}

export async function fetchLastViewed(userId: string): Promise<LastViewedMap | null> {
  if (!userId) return null

  try {
    const userData = await pb.collection('users').getOne(userId)
    return (userData.lastViewed ?? {}) as LastViewedMap
  } catch (e) {
    if (e) throw e
    return null
  }
}

export async function upsertRecord(
  collection: string,
  data: IdAndName | Recipe | RecipeIngredient,
): Promise<string | undefined> {
  // getList() is the only PocketBase records method that doesn't throw
  // on a missing record, so it seems like the best way to check existence

  if (SHARED_NAME_COLLECTIONS.has(collection)) {
    const namedData = data as IdAndName
    const normalizedName = normalizeName(namedData.name)
    const payload = { ...namedData, name: normalizedName }

    try {
      const existingByName = await pb.collection(collection).getList(1, 1, {
        filter: `name=${JSON.stringify(normalizedName)}`,
      })
      if (existingByName.items[0]) return existingByName.items[0].id

      const createdRecord = await pb.collection(collection).create(payload)
      return createdRecord.id
    } catch (e) {
      const retry = await pb.collection(collection).getList(1, 1, {
        filter: `name=${JSON.stringify(normalizedName)}`,
      })
      if (retry.items[0]) return retry.items[0].id
      if (e) throw e
      return undefined
    }
  }

  try {
    const existingRecord = await pb.collection(collection).getList(1, 1, {
      filter: `id=${JSON.stringify(data.id)}`,
    })

    if (existingRecord.items.length) {
      if (!(collection === 'recipes' || collection === 'recipe_ingredients')) return

      const dataWithoutId: Partial<IdAndName | Recipe | RecipeIngredient> = { ...data }
      delete dataWithoutId.id
      await pb.collection(collection).update(data.id, dataWithoutId)
      return existingRecord.items[0]?.id ?? data.id
    } else {
      const createdRecord = await pb.collection(collection).create(data)
      return createdRecord.id
    }
  } catch (e) {
    if (e) throw e
  }
}

export async function fetchAll(collection: string, options?: Record<string, unknown>) {
  return await pb.collection(collection).getFullList({ ...options })
}

export async function deleteRecord(collection: string, id: string): Promise<void> {
  try {
    await pb.collection(collection).delete(id)
  } catch (e) {
    if (e instanceof ClientResponseError && e.status === 404) return
    if (e) throw e
  }
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
