export type UUID = string

export type IdAndName = {
  id: UUID
  name: string
}

export type Ingredient = IdAndName
export type Tag = IdAndName
export type Unit = IdAndName

export type UserSetting = { key: string; value: string }

export type User = {
  id: UUID
  email: string
  verified: boolean
  settings: UserSetting[]
}

export type UserSettings = {
  theme?: string
  accent?: string
  keepScreenOn?: boolean
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

export type MatchedIngredient = QuantityUnitText[] | string

export type QuantityUnitText = {
  normalizedLine: string
  textBeforeFirstMatch?: string
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

export type RecipeLocal = Omit<Recipe, 'userId' | 'updated'> & {
  deletedRecipeIngredientIds?: UUID[]
  synced: boolean
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

export type EditableRecipeIngredient = {
  textBefore: string
  quantity: string
  hasRange: boolean
  quantityUpper: string
  unit: string
  textAfter: string
}

export type RecipeEdit = {
  name: string
  tags: string | string[]
  favorite: boolean
  servings: number | undefined
  ingredients: EditableRecipeIngredient[]
  instructions: string
  notes: string
}

export type SyncStatus = 'synced' | 'pulling' | 'pushing' | 'offline' | 'error'

export type SyncResult = {
  success: boolean
  pushedRecipes?: number
  pulledRecipes?: number
  errors?: string
  error?: string
}
