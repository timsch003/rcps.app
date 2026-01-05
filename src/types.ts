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
  recipeId: string
  ingredientId: string
  quantity?: number
  unit?: IdAndName
  notes?: string
  sortOrder?: number
}

export interface Recipe {
  id: string
  userId: string
  name: string
  tags?: IdAndName[]
  recipeIngredients?: RecipeIngredient[]
  instructions?: string
  notes?: string
}

// Sync & Offline Support Types
export interface RecipeLocal extends Recipe {
  // Sync Status Tracking
  updated: number // Unix timestamp (ms)
  deviceId: string // Your device identifier
  synced: boolean // Last known sync status
  pendingSync: boolean // Awaiting sync attempt
  localOnly: boolean // New record not yet on server
  syncError?: string // Last sync error message
  retryCount: number // Number of failed attempts
  lastRetry?: number // Last retry timestamp

  // Conflict Detection
  conflictDetected: boolean // User awareness flag
  serverVersion?: RecipeLocal // Store server version on conflict

  // Field-level Tracking (for 3-way merge)
  original?: RecipeLocal // Original version before edits
}

export function setRecipeLocalField<K extends keyof RecipeLocal>(
  obj: RecipeLocal,
  key: K,
  value: RecipeLocal[K],
) {
  obj[key] = value
}

export interface SyncMetadata {
  id: string
  lastSynced: number
  lastConflictResolved: number
  pendingCount: number
  failedCount: number
}

export interface PendingChange {
  id: string
  recipeId: string
  operation: 'create' | 'update' | 'delete'
  timestamp: number
  data: Partial<RecipeLocal>
  deviceId: string
  retryCount: number
  maxRetries: number
  lastError?: string
  lastRetry?: number
  backoffMs?: number
}

export interface ConflictLog {
  id: string
  recipeId: string
  timestamp: number
  localVersion: RecipeLocal
  remoteVersion: RecipeLocal
  resolutionStrategy: 'localWins' | 'remoteWins' | 'manual'
  resolvedVersion: RecipeLocal
  deviceId: string
}

export interface ValidationError {
  field: string
  message: string
  value: unknown
}

export interface DeviceRegistry {
  id: string
  userId: string
  deviceId: string
  deviceName?: string
  lastSync: number
  created: number
}

export type ConflictResolutionStrategy =
  | 'last-write-wins'
  | 'local-preferred'
  | 'remote-preferred'
  | 'manual'

export interface ConflictResolution {
  strategy: ConflictResolutionStrategy
  resolved: RecipeLocal
  conflicts: string[] // Fields that had conflicting changes
  userAction?: 'accept' | 'reject' // For manual resolution
}

export type SyncState = 'idle' | 'syncing' | 'syncing_batch' | 'reconciling' | 'error' | 'conflict'
export type RecipeSyncState = 'synced' | 'pending' | 'error' | 'conflict' | 'syncing'

export interface SyncProgress {
  current: number
  total: number
  recipeId: string
  status: 'processing' | 'completed' | 'failed'
}
