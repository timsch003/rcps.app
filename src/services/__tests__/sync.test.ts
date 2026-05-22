import { beforeEach, describe, expect, it, vi } from 'vitest'

type AnyRecord = { id: string } & Record<string, unknown>

const state = vi.hoisted(() => {
  const recipes = new Map<string, AnyRecord>()
  const recipeIngredients = new Map<string, AnyRecord>()
  const tags = new Map<string, AnyRecord>()
  const ingredients = new Map<string, AnyRecord>()
  const units = new Map<string, AnyRecord>()

  const syncStatuses: string[] = []

  function createTable(map: Map<string, AnyRecord>) {
    return {
      where: (field: string) => {
        void field
        return {
          anyOf: (ids: string[]) => ({
            toArray: async () => ids.map((id) => map.get(id)).filter(Boolean),
          }),
        }
      },
      toArray: async () => Array.from(map.values()),
      delete: async (id: string) => {
        map.delete(id)
      },
      put: async (value: AnyRecord) => {
        map.set(value.id, { ...value })
      },
      bulkPut: async (values: AnyRecord[]) => {
        for (const value of values) map.set(value.id, { ...value })
      },
      bulkDelete: async (ids: string[]) => {
        for (const id of ids) map.delete(id)
      },
      update: async (id: string, patch: AnyRecord) => {
        const current = map.get(id)
        if (!current) return
        map.set(id, { ...current, ...patch })
      },
      filter: (predicate: (row: AnyRecord) => boolean) => ({
        toArray: async () => Array.from(map.values()).filter(predicate),
      }),
    }
  }

  return {
    recipes,
    recipeIngredients,
    tags,
    ingredients,
    units,
    syncStatuses,
    db: {
      recipes: createTable(recipes),
      recipe_ingredients: createTable(recipeIngredients),
      tags: createTable(tags),
      ingredients: createTable(ingredients),
      units: createTable(units),
    },
  }
})

const pocketbaseMocks = vi.hoisted(() => ({
  upsertRecord: vi.fn(),
  deleteRecord: vi.fn(),
  fetchAll: vi.fn(),
  updateUserSettings: vi.fn(),
  fetchUserSettings: vi.fn(),
  updateLastViewed: vi.fn(),
  fetchLastViewed: vi.fn(),
}))

vi.mock('@/adapters/dexie', () => ({
  db: state.db,
}))

vi.mock('@/adapters/pocketbase', () => pocketbaseMocks)

vi.mock('@/stores/sync_status', () => ({
  useSyncStore: () => ({
    setStatus: (status: string) => state.syncStatuses.push(status),
    isOffline: () => false,
  }),
}))

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({
    isAuth: true,
    user: { id: 'user-1', email: 'u@example.com', verified: true },
  }),
}))

vi.mock('@/stores/settings', () => ({
  useSettingsStore: () => ({
    hasLocalChanges: false,
    getStoredSettings: () => ({}),
    markSettingsSynced: vi.fn(),
    hydrate: vi.fn(() => null),
  }),
}))

vi.mock('@/stores/last_viewed', () => ({
  useLastViewedStore: () => ({
    getMap: () => ({}),
    merge: vi.fn(() => ({ changes: false, merged: {} })),
  }),
}))

vi.mock('@/services/recipes_manager', () => ({
  recipesManager: {
    removeRecipeFromCache: vi.fn(),
    updateCaches: vi.fn(),
    updateLastViewedCache: vi.fn(),
  },
}))

vi.mock('@/services/tags_manager', () => ({
  tagsManager: {
    addOrGetExisting: vi.fn(async () => undefined),
    removeOrphanedFromLocal: vi.fn(),
    cacheAll: vi.fn(),
  },
}))

vi.mock('@/services/ingredients_manager', () => ({
  ingredientsManager: {
    addOrGetExisting: vi.fn(async () => 'ing-local'),
  },
}))

vi.mock('@/services/units_manager', () => ({
  unitsManager: {
    addOrGetExisting: vi.fn(async () => 'unit-local'),
    cacheAll: vi.fn(),
  },
}))

import { sync } from '@/services/sync'
import { ingredientsManager } from '@/services/ingredients_manager'
import { unitsManager } from '@/services/units_manager'

describe('sync recipe_ingredients ID stability', () => {
  beforeEach(() => {
    state.recipes.clear()
    state.recipeIngredients.clear()
    state.tags.clear()
    state.ingredients.clear()
    state.units.clear()
    state.syncStatuses.length = 0
    vi.clearAllMocks()

    pocketbaseMocks.fetchUserSettings.mockResolvedValue(null)
    pocketbaseMocks.fetchLastViewed.mockResolvedValue({})
    pocketbaseMocks.updateUserSettings.mockResolvedValue(undefined)
    pocketbaseMocks.updateLastViewed.mockResolvedValue(undefined)
    pocketbaseMocks.deleteRecord.mockResolvedValue(undefined)
    pocketbaseMocks.upsertRecord.mockImplementation(
      async (_collection: string, data: AnyRecord) => data.id,
    )
    pocketbaseMocks.fetchAll.mockImplementation(async (collection: string) => {
      if (collection === 'recipes') return []
      if (collection === 'recipe_ingredients') return []
      return []
    })
  })

  it('does not delete freshly pulled recipe_ingredients for updated recipes', async () => {
    state.recipes.set('recipe-1', {
      id: 'recipe-1',
      name: 'Soup',
      servings: 2,
      tagIds: [],
      favorite: false,
      recipeIngredientIds: ['ri-1'],
      updated: 100,
      deletedRecipeIngredientIds: [],
      synced: true,
      deleted: false,
    })

    state.recipeIngredients.set('ri-1', {
      id: 'ri-1',
      recipeId: 'recipe-1',
      ingredientId: 'ingredient-old',
      sortOrder: 0,
    })

    pocketbaseMocks.fetchAll.mockImplementation(async (collection: string) => {
      if (collection === 'recipes') {
        return [
          {
            id: 'recipe-1',
            name: 'Soup',
            servings: 2,
            tagIds: [],
            favorite: false,
            instructions: '',
            notes: '',
            updated: 101,
            expand: { tagIds: [] },
          },
        ]
      }

      if (collection === 'recipe_ingredients') {
        return [
          {
            id: 'ri-1',
            recipeId: 'recipe-1',
            ingredientId: 'ingredient-remote',
            quantity: 1,
            quantityUpper: undefined,
            unitId: undefined,
            quantityUnitPosition: 0,
            sortOrder: 0,
            expand: {
              ingredientId: { id: 'ingredient-remote', name: 'tomato' },
            },
          },
        ]
      }

      return []
    })

    await sync.trigger(true)

    expect(state.recipeIngredients.get('ri-1')).toBeTruthy()
    expect(state.recipes.get('recipe-1')?.recipeIngredientIds).toEqual(['ri-1'])
    expect(state.syncStatuses).toContain('synced')
  })

  it('reconciles local recipeIngredientIds when push returns a different remote id', async () => {
    state.recipes.set('recipe-1', {
      id: 'recipe-1',
      name: 'Soup',
      servings: 2,
      tagIds: [],
      favorite: false,
      recipeIngredientIds: ['ri-local'],
      updated: 100,
      deletedRecipeIngredientIds: [],
      synced: false,
      deleted: false,
    })

    state.recipeIngredients.set('ri-local', {
      id: 'ri-local',
      recipeId: 'recipe-1',
      ingredientId: 'ingredient-local',
      quantity: 1,
      sortOrder: 0,
    })

    state.ingredients.set('ingredient-local', {
      id: 'ingredient-local',
      name: 'tomato',
    })

    pocketbaseMocks.upsertRecord.mockImplementation(async (collection: string, data: AnyRecord) => {
      if (collection === 'ingredients') return 'ingredient-remote'
      if (collection === 'recipes') return data.id
      if (collection === 'recipe_ingredients') return 'ri-remote'
      return data.id
    })

    pocketbaseMocks.fetchAll.mockImplementation(async (collection: string) => {
      if (collection === 'recipes') {
        return [
          {
            id: 'recipe-1',
            name: 'Soup',
            servings: 2,
            tagIds: [],
            favorite: false,
            instructions: '',
            notes: '',
            updated: 100,
            expand: { tagIds: [] },
          },
        ]
      }
      return []
    })

    await sync.trigger()

    expect(state.recipeIngredients.get('ri-local')).toBeFalsy()
    expect(state.recipeIngredients.get('ri-remote')).toBeTruthy()
    expect(state.recipes.get('recipe-1')?.recipeIngredientIds).toEqual(['ri-remote'])
  })

  it('pulls multiple recipe ingredients and maps ingredient/unit relations to local ids', async () => {
    vi.mocked(ingredientsManager.addOrGetExisting).mockImplementation(async (name: string) => {
      if (name === 'tomato') return 'ing-local-tomato'
      if (name === 'salt') return 'ing-local-salt'
      return 'ing-local-fallback'
    })

    vi.mocked(unitsManager.addOrGetExisting).mockImplementation(async (name: string) => {
      if (name === 'g') return 'unit-local-g'
      if (name === 'tbsp') return 'unit-local-tbsp'
      return 'unit-local-fallback'
    })

    pocketbaseMocks.fetchAll.mockImplementation(async (collection: string) => {
      if (collection === 'recipes') {
        return [
          {
            id: 'recipe-2',
            name: 'Salad',
            servings: 4,
            tagIds: [],
            favorite: false,
            instructions: '',
            notes: '',
            updated: 500,
            expand: { tagIds: [] },
          },
        ]
      }

      if (collection === 'recipe_ingredients') {
        return [
          {
            id: 'ri-2a',
            recipeId: 'recipe-2',
            ingredientId: 'ing-remote-1',
            quantity: 120,
            quantityUpper: undefined,
            unitId: 'unit-remote-1',
            quantityUnitPosition: 0,
            sortOrder: 0,
            expand: {
              ingredientId: { id: 'ing-remote-1', name: 'tomato' },
              unitId: { id: 'unit-remote-1', name: 'g' },
            },
          },
          {
            id: 'ri-2b',
            recipeId: 'recipe-2',
            ingredientId: 'ing-remote-2',
            quantity: 1,
            quantityUpper: undefined,
            unitId: 'unit-remote-2',
            quantityUnitPosition: 1,
            sortOrder: 1,
            expand: {
              ingredientId: { id: 'ing-remote-2', name: 'salt' },
              unitId: { id: 'unit-remote-2', name: 'tbsp' },
            },
          },
        ]
      }

      return []
    })

    await sync.trigger(true)

    expect(state.recipes.get('recipe-2')?.recipeIngredientIds).toEqual(['ri-2a', 'ri-2b'])

    expect(state.recipeIngredients.get('ri-2a')).toMatchObject({
      recipeId: 'recipe-2',
      ingredientId: 'ing-local-tomato',
      unitId: 'unit-local-g',
      sortOrder: 0,
    })

    expect(state.recipeIngredients.get('ri-2b')).toMatchObject({
      recipeId: 'recipe-2',
      ingredientId: 'ing-local-salt',
      unitId: 'unit-local-tbsp',
      sortOrder: 1,
    })
  })

  it('replaces stale local recipe_ingredients with a new remote set on recipe update', async () => {
    state.recipes.set('recipe-3', {
      id: 'recipe-3',
      name: 'Pasta',
      servings: 2,
      tagIds: [],
      favorite: false,
      recipeIngredientIds: ['ri-old-1', 'ri-old-2'],
      updated: 100,
      deletedRecipeIngredientIds: [],
      synced: true,
      deleted: false,
    })

    state.recipeIngredients.set('ri-old-1', {
      id: 'ri-old-1',
      recipeId: 'recipe-3',
      ingredientId: 'ing-old-a',
      unitId: 'unit-old-a',
      sortOrder: 0,
    })

    state.recipeIngredients.set('ri-old-2', {
      id: 'ri-old-2',
      recipeId: 'recipe-3',
      ingredientId: 'ing-old-b',
      unitId: 'unit-old-b',
      sortOrder: 1,
    })

    vi.mocked(ingredientsManager.addOrGetExisting).mockImplementation(async (name: string) => {
      if (name === 'basil') return 'ing-local-basil'
      if (name === 'olive oil') return 'ing-local-oil'
      return 'ing-local-fallback'
    })

    vi.mocked(unitsManager.addOrGetExisting).mockImplementation(async (name: string) => {
      if (name === 'g') return 'unit-local-g'
      if (name === 'tbsp') return 'unit-local-tbsp'
      return 'unit-local-fallback'
    })

    pocketbaseMocks.fetchAll.mockImplementation(async (collection: string) => {
      if (collection === 'recipes') {
        return [
          {
            id: 'recipe-3',
            name: 'Pasta',
            servings: 3,
            tagIds: [],
            favorite: true,
            instructions: 'mix',
            notes: '',
            updated: 200,
            expand: { tagIds: [] },
          },
        ]
      }

      if (collection === 'recipe_ingredients') {
        return [
          {
            id: 'ri-new-1',
            recipeId: 'recipe-3',
            ingredientId: 'ing-remote-basil',
            quantity: 20,
            quantityUpper: undefined,
            unitId: 'unit-remote-g',
            quantityUnitPosition: 0,
            sortOrder: 0,
            expand: {
              ingredientId: { id: 'ing-remote-basil', name: 'basil' },
              unitId: { id: 'unit-remote-g', name: 'g' },
            },
          },
          {
            id: 'ri-new-2',
            recipeId: 'recipe-3',
            ingredientId: 'ing-remote-oil',
            quantity: 2,
            quantityUpper: undefined,
            unitId: 'unit-remote-tbsp',
            quantityUnitPosition: 1,
            sortOrder: 1,
            expand: {
              ingredientId: { id: 'ing-remote-oil', name: 'olive oil' },
              unitId: { id: 'unit-remote-tbsp', name: 'tbsp' },
            },
          },
        ]
      }

      return []
    })

    await sync.trigger(true)

    expect(state.recipeIngredients.get('ri-old-1')).toBeFalsy()
    expect(state.recipeIngredients.get('ri-old-2')).toBeFalsy()

    expect(state.recipeIngredients.get('ri-new-1')).toMatchObject({
      recipeId: 'recipe-3',
      ingredientId: 'ing-local-basil',
      unitId: 'unit-local-g',
      sortOrder: 0,
    })

    expect(state.recipeIngredients.get('ri-new-2')).toMatchObject({
      recipeId: 'recipe-3',
      ingredientId: 'ing-local-oil',
      unitId: 'unit-local-tbsp',
      sortOrder: 1,
    })

    expect(state.recipes.get('recipe-3')).toMatchObject({
      servings: 3,
      favorite: true,
      recipeIngredientIds: ['ri-new-1', 'ri-new-2'],
      synced: true,
      deleted: false,
    })
  })

  it('does not pull a recipe immediately after pushing it in the same sync cycle', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1000)

    state.recipes.set('recipe-4', {
      id: 'recipe-4',
      name: 'Toast',
      servings: 1,
      tagIds: [],
      favorite: false,
      recipeIngredientIds: [],
      updated: 100,
      deletedRecipeIngredientIds: [],
      synced: false,
      deleted: false,
    })

    pocketbaseMocks.upsertRecord.mockImplementation(
      async (_collection: string, data: AnyRecord) => {
        return data.id
      },
    )

    pocketbaseMocks.fetchAll.mockImplementation(async (collection: string) => {
      if (collection === 'recipes') {
        return [
          {
            id: 'recipe-4',
            name: 'Toast',
            servings: 1,
            tagIds: [],
            favorite: false,
            instructions: '',
            notes: '',
            updated: 1000,
            expand: { tagIds: [] },
          },
        ]
      }
      if (collection === 'recipe_ingredients') return []
      return []
    })

    await sync.trigger()

    expect(state.recipes.get('recipe-4')).toMatchObject({
      synced: true,
      updated: 1000,
    })

    const pullRecipeIngredientCalls = pocketbaseMocks.fetchAll.mock.calls.filter(
      ([collection]) => collection === 'recipe_ingredients',
    )
    expect(pullRecipeIngredientCalls).toHaveLength(0)
  })
})
