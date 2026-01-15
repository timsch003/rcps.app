export type UUID = string

export type IdAndName = {
  id: UUID
  name: string
}

export type Ingredient = IdAndName
export type Tag = IdAndName
export type Unit = IdAndName

export type SyncState = 'synced' | 'syncing' | 'offline'

export type PendingChangeOperation = 'create' | 'update' | 'delete'

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
  notes?: string
  sortOrder?: number
}

export type ParsedRecipeIngredient = Omit<
  RecipeIngredient,
  'id' | 'recipeId' | 'ingredientId' | 'unitId'
> & {
  quantity?: number
  unit?: string
  name: string
  notes?: string
}

export type Recipe = {
  id: UUID
  userId: UUID
  name: string
  tagIds?: UUID[]
  servings?: number
  recipeIngredientIds?: UUID[]
  instructions?: string
  notes?: string
  updated?: number
}

export type RecipeLocal = Omit<Recipe, 'userId'> & {
  synced: boolean
}

export type ParsedRecipe = Omit<Recipe, 'userId' | 'tagIds' | 'recipeIngredientIds' | 'updated'> & {
  tags: string[]
  ingredients: ParsedRecipeIngredient[]
}

export type SyncMetadata = {
  lastSync: number
  pendingChanges: number
}

export type PendingChange = {
  id: UUID
  operation: PendingChangeOperation
  timestamp: number
  data: Partial<RecipeLocal>
}
