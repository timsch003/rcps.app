import { pb } from './pocketbase'
import { validators } from './validators'
import type { ValidationError } from '@/types'

/**
 * User authentication service
 * Handles registration, login, logout using PocketBase SDK
 */

export async function registerUser(
  email: string,
  password: string,
  userId: string,
): Promise<{ success: boolean; errors: ValidationError[] }> {
  const emailErrors = validators.validateEmail(email)
  const passwordErrors = validators.validatePassword(password)
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
  } catch (e: unknown) {
    return {
      success: false,
      errors: [
        {
          field: 'registration',
          message: (e as Error).message || 'Registration failed',
          value: null,
        },
      ],
    }
  }
}

export async function loginUser(
  email: string,
  password: string,
): Promise<{ success: boolean; errors: ValidationError[] }> {
  try {
    await pb.collection('users').authWithPassword(email, password)
    return { success: true, errors: [] }
  } catch (e: unknown) {
    return {
      success: false,
      errors: [
        {
          field: 'login',
          message: (e as Error).message || 'Login failed',
          value: null,
        },
      ],
    }
  }
}

export async function logoutUser(): Promise<void> {
  pb.authStore.clear()
}

export function getCurrentUser(): unknown {
  return pb.authStore.record
}

export function isAuthenticated(): boolean {
  return pb.authStore.isValid
}
