export type UUID = string

export type IdAndName = {
  id: UUID
  name: string
}

// Derived from PocketBase collections {

export type Ingredient = IdAndName

export type Tag = IdAndName

export type Unit = IdAndName

export type User = {
  id: UUID
  email: string
  verified: boolean
  settings: { key: string; value: string }[]
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

export type Recipe = {
  id: UUID
  userId: UUID
  name: string
  tagIds?: UUID[]
  recipeIngredientIds?: UUID[]
  instructions?: string
  notes?: string
  updated?: number | null
}

export type RecipeLocal = Omit<Recipe, 'userId'> & {
  synced: boolean
  pendingSync: boolean
}

export type SyncMetadata = {
  lastSynced: number
  pendingChanges: number
}

export type SyncDataType = 'recipes' | 'settings'

export type SyncState = 'synced' | 'syncing' | 'offline'

export type PendingChangeOperation = 'create' | 'update' | 'delete'

export type PendingChange = {
  id: UUID
  type: SyncDataType
  operation: PendingChangeOperation
  timestamp: number
  data: Partial<RecipeLocal>
  deviceId: UUID
}
