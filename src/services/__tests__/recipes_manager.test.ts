import { beforeEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => {
  const recipes = new Map<string, any>()
  const recipeIngredients = new Map<string, any>()

  const recipesStore = {
    favorites: [] as any[],
    tagged: [] as any[],
    lastViewed: [] as any[],
    cachedTagId: '',
    sortByName: (items: any[]) => items,
    sortByCreated: (items: any[]) => items,
    populateLastViewedCache: vi.fn(),
    cacheFavorites: vi.fn(),
    cacheTagged: vi.fn(),
    removeCached: vi.fn(),
  }

  const db = {
    recipes: {
      get: vi.fn(async (id: string) => recipes.get(id)),
      put: vi.fn(async (recipe: any) => {
        recipes.set(recipe.id, { ...recipe })
      }),
      update: vi.fn(async (id: string, patch: any) => {
        const current = recipes.get(id)
        if (!current) return
        recipes.set(id, { ...current, ...patch })
      }),
      filter: vi.fn(),
      where: vi.fn(),
      delete: vi.fn(async (id: string) => {
        recipes.delete(id)
      }),
    },
    recipe_ingredients: {
      bulkDelete: vi.fn(async (ids: string[]) => {
        for (const id of ids) recipeIngredients.delete(id)
      }),
    },
  }

  return {
    recipes,
    recipeIngredients,
    db,
    recipesStore,
  }
})

const ingredientsManagerMock = vi.hoisted(() => ({
  addRecipeIngredient: vi.fn(),
}))

const tagsManagerMock = vi.hoisted(() => ({
  addOrGetExisting: vi.fn(),
  removeOrphanedFromLocal: vi.fn(),
}))

const syncTriggerMock = vi.hoisted(() => vi.fn(async () => undefined))

vi.mock('@/adapters/dexie', () => ({
  db: state.db,
}))

vi.mock('@/services/ingredients_manager', () => ({
  ingredientsManager: ingredientsManagerMock,
}))

vi.mock('@/services/tags_manager', () => ({
  tagsManager: tagsManagerMock,
}))

vi.mock('@/stores/recipes', () => ({
  useRecipesStore: () => state.recipesStore,
}))

vi.mock('@/stores/last_viewed', () => ({
  useLastViewedStore: () => ({
    orderedIds: [],
  }),
}))

vi.mock('@/services/sync', () => ({
  sync: {
    trigger: syncTriggerMock,
  },
}))

import { recipesManager } from '@/services/recipes_manager'
import type { RecipeRaw } from '@/types'

describe('recipesManager.createEdit', () => {
  beforeEach(() => {
    state.recipes.clear()
    state.recipeIngredients.clear()
    vi.clearAllMocks()

    tagsManagerMock.addOrGetExisting.mockResolvedValue(undefined)
    ingredientsManagerMock.addRecipeIngredient
      .mockResolvedValueOnce('ri-new-1')
      .mockResolvedValueOnce('ri-new-2')
  })

  it('replaces previous recipeIngredientIds on edit and queues old ids for deletion', async () => {
    state.recipes.set('recipe-1', {
      id: 'recipe-1',
      name: 'Soup',
      tagIds: [],
      favorite: false,
      servings: 2,
      recipeIngredientIds: ['ri-old-1', 'ri-old-2'],
      instructions: '',
      notes: '',
      updated: 100,
      deletedRecipeIngredientIds: ['ri-even-older'],
      synced: true,
      deleted: false,
    })

    state.recipeIngredients.set('ri-old-1', { id: 'ri-old-1' })
    state.recipeIngredients.set('ri-old-2', { id: 'ri-old-2' })

    const raw: RecipeRaw = {
      name: 'Soup',
      tags: [],
      favorite: true,
      servings: 3,
      ingredients: '1 tomato\n2 salt',
      matchedIngredients: [
        { normalizedLine: '1 tomato', sortOrder: 0 },
        { normalizedLine: '2 salt', sortOrder: 100 },
      ],
      instructions: 'Mix',
      notes: '',
    }

    const recipeId = await recipesManager.createEdit(raw, 'recipe-1')

    expect(recipeId).toBe('recipe-1')
    expect(state.db.recipe_ingredients.bulkDelete).toHaveBeenCalledWith(['ri-old-1', 'ri-old-2'])
    expect(state.recipeIngredients.has('ri-old-1')).toBe(false)
    expect(state.recipeIngredients.has('ri-old-2')).toBe(false)

    expect(state.db.recipes.put).toHaveBeenCalledTimes(1)
    expect(state.recipes.get('recipe-1')).toMatchObject({
      recipeIngredientIds: ['ri-new-1', 'ri-new-2'],
      deletedRecipeIngredientIds: ['ri-even-older', 'ri-old-1', 'ri-old-2'],
      synced: false,
      deleted: false,
      favorite: true,
      servings: 3,
    })
  })
})
