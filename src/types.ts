export interface IdAndName {
  id: string
  name: string
}

export interface User {
  id: string
  email: string
  verified: boolean
}

export interface RecipeIngredient {
  id: string
  recipeId: string
  quantity?: number
  unitId?: string
  notes?: string
  sortOrder?: number
}

export interface Recipe {
  id: string
  userId: string
  name: string
  tagIds?: string[]
  ingredients?: RecipeIngredient[]
  instructions?: string
  notes?: string
}

export type SyncDataType = 'recipes' | 'account' | 'settings'
export type SyncState = 'synced' | 'syncing' | 'offline'
export type LocalSyncState = 'synced' | 'pending' | 'syncing'

export interface RecipeLocal extends Recipe {
  updated: number
  deviceId: string
  synced: boolean
  pendingSync: boolean
  localOnly: boolean
  serverVersion?: RecipeLocal
  original?: RecipeLocal
}

export function setRecipeLocalField<K extends keyof RecipeLocal>(
  obj: RecipeLocal,
  key: K,
  value: RecipeLocal[K],
) {
  obj[key] = value
}

export interface SyncMetadata {
  type: SyncDataType
  lastSynced: number
  pendingCount: number
}

export interface PendingChange {
  id: string
  type: SyncDataType
  operation: 'create' | 'update' | 'delete'
  timestamp: number
  data: Partial<RecipeLocal>
  deviceId: string
}
