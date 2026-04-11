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

export type RecipeIngredient = {
  id: UUID
  recipeId: UUID
  ingredientId: UUID
  quantity?: number
  unitId?: UUID
  quantityUnitPosition?: number
  sortOrder?: number
}

export type MatchedIngredient = QuantityUnitText[] | string

export type QuantityUnitText = {
  trimmedLine: string
  textBeforeFirstMatch?: string
  quantity?: number
  knownUnit?: string
  textAfterQuantity?: string
  selected?: boolean
}

export type Recipe = {
  id: UUID
  userId: UUID
  name: string
  servings: number
  tagIds?: UUID[]
  recipeIngredientIds?: UUID[]
  instructions?: string
  notes?: string
  updated?: number
}

export type RecipeLocal = Omit<Recipe, 'userId' | 'updated'> & {
  synced: boolean
}

export type RecipeRaw = {
  name: string
  tags: string | string[]
  servings: number | undefined
  ingredients: string
  matchedIngredients: MatchedIngredient[] | []
  instructions: string
  notes: string
}

export type SyncMetadata = {
  lastSync: number
  pendingChanges: number
}

export type SyncState = 'synced' | 'syncing' | 'offline'

export type PendingChangeOperation = 'create' | 'update' | 'delete'

export type PendingChange = {
  id: UUID
  operation: PendingChangeOperation
  timestamp: number
  data: Partial<RecipeLocal>
}
