export type UUID = string

export type IdAndName = {
  id: UUID
  name: string
}

export type Ingredient = IdAndName
export type Tag = IdAndName
export type Unit = IdAndName

export type UserSetting = { key: string; value: string }

export type ThemeMode = 'light' | 'dark'

export type User = {
  id: UUID
  email: string
  verified: boolean
  settings: UserSetting[]
}

// Per-recipe last-viewed timestamps, merges via max-per-key (LWW per entry)
export type LastViewedMap = Record<UUID, number>

export type UserSettings = {
  theme?: string
  accentDark?: string
  accentLight?: string
  keepScreenOn?: boolean
  updatedAt?: number
}

export type RecipeIngredient = {
  id: UUID
  recipeId: UUID
  ingredientId: UUID
  quantity?: number
  quantityUpper?: number
  unitId?: UUID
  quantityUnitPosition?: number
  sortOrder: number
}

export type MatchedIngredient = {
  normalizedLine: string
  textBeforeFirstMatch?: string
  parts?: QuantityUnitText[] | undefined
  sortOrder: number
}

export type QuantityUnitText = {
  quantity?: number
  quantityUpper?: number
  knownUnit?: string
  textAfterQuantity?: string
  selected?: boolean
}

export type Recipe = {
  id: UUID
  userId: UUID
  name: string
  servings: number
  tagIds: UUID[]
  favorite: boolean
  recipeIngredientIds?: UUID[]
  instructions?: string
  notes?: string
  updated?: number
}

export type RecipeLocal = Omit<Recipe, 'userId'> & {
  deletedRecipeIngredientIds?: UUID[]
  synced: boolean
  deleted: boolean
}

export type RecipeRaw = {
  name: string
  tags: string | string[]
  favorite: boolean
  servings: number | undefined
  ingredients: string
  matchedIngredients: MatchedIngredient[] | []
  instructions: string
  notes: string
}

export type ImportedRecipeDraft = {
  name: string
  tags: string[]
  ingredients: string
  instructions: string
  notes: string
}

export type SyncStatus =
  | 'synced'
  | 'pulling'
  | 'pushing'
  | 'offline'
  | 'unsynced'
  | 'unsynced-offline'
  | 'error'

export type SyncResult = {
  success: boolean
  pushedRecipes?: number
  pulledRecipes?: number
  errors?: string
  error?: string
}
