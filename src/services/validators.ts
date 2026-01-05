import type { ValidationError } from '@/types'

/**
 * Consolidated validators for auth and recipes
 */
export const validators = {
  /**
   * Validate email format
   */
  validateEmail(email: string): ValidationError[] {
    const errors: ValidationError[] = []
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!email || !emailRegex.test(email)) {
      errors.push({ field: 'email', message: 'Valid email is required', value: email })
    }

    return errors
  },

  /**
   * Validate password strength
   */
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

  /**
   * Validate recipe data
   */
  validateRecipe(recipe: Record<string, unknown>): ValidationError[] {
    const errors: ValidationError[] = []

    if (!recipe.id || typeof recipe.id !== 'string') {
      errors.push({ field: 'id', message: 'ID must be a string', value: recipe.id })
    }

    if (!recipe.name || typeof recipe.name !== 'string' || recipe.name.trim().length === 0) {
      errors.push({
        field: 'name',
        message: 'Name is required and must be non-empty',
        value: recipe.name,
      })
    }

    if (recipe.name && typeof recipe.name === 'string' && recipe.name.length > 255) {
      errors.push({
        field: 'name',
        message: 'Name must not exceed 255 characters',
        value: recipe.name,
      })
    }

    if (typeof recipe.updated !== 'number' || recipe.updated < 0) {
      errors.push({
        field: 'updated',
        message: 'Updated timestamp must be a positive number',
        value: recipe.updated,
      })
    }

    if (!recipe.device_id || typeof recipe.device_id !== 'string') {
      errors.push({
        field: 'device_id',
        message: 'Device ID is required',
        value: recipe.device_id,
      })
    }

    if (recipe.retry_count !== undefined && typeof recipe.retry_count !== 'number') {
      errors.push({
        field: 'retry_count',
        message: 'Retry count must be a number',
        value: recipe.retry_count,
      })
    }

    return errors
  },

  /**
   * Check if recipe is valid
   */
  isRecipeValid(recipe: Record<string, unknown>): boolean {
    return this.validateRecipe(recipe).length === 0
  },
}
