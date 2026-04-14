import PocketBase, { LocalAuthStore, ClientResponseError } from 'pocketbase'
import { v7 as uuidv7 } from 'uuid'
import translateError from '@/utils/pb_error_translation'

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
  data: Record<string, unknown>,
): Promise<void> {
  try {
    await pb.collection(collection).create(data, { requestKey: null })
  } catch (e: unknown) {
    if (e instanceof ClientResponseError && e.status === 400) {
      const { id, ...updateData } = data
      await pb.collection(collection).update(id as string, updateData, { requestKey: null })
    } else {
      throw e
    }
  }
}

export async function fetchFullList(collection: string, options?: Record<string, unknown>) {
  return await pb.collection(collection).getFullList({ requestKey: null, ...options })
}

export { pb, ClientResponseError }
