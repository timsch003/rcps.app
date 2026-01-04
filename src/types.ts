export type UUID = `${string}-${string}-${string}-${string}-${string}`

export type IdName = {
  id: UUID
  name: string
}

export type User = {
  id: UUID
  email: string
  verified: boolean
}

export type RecipeIngredient = {
  recipeId: UUID
  ingredientId: UUID
  quantity?: number
  unit?: IdName
  notes?: string
  sortOrder?: number
}

export type Recipe = {
  id: UUID
  userId: UUID
  name: string
  tags?: IdName[]
  recipeIngredients?: RecipeIngredient[]
  instructions?: string
  notes?: string
}

// Sync & Offline Support Types
export interface RecipeLocal extends Recipe {
  // Sync Status Tracking
  updated: number // Unix timestamp (ms)
  device_id: string // Your device identifier
  synced: boolean // Last known sync status
  pending_sync: boolean // Awaiting sync attempt
  local_only: boolean // New record not yet on server
  sync_error?: string // Last sync error message
  retry_count: number // Number of failed attempts
  last_retry?: number // Last retry timestamp

  // Conflict Detection
  conflict_detected: boolean // User awareness flag
  server_version?: RecipeLocal // Store server version on conflict

  // Field-level Tracking (for 3-way merge)
  _original?: RecipeLocal // Original version before edits
}

export interface SyncMetadata {
  id: string
  last_synced: number
  last_conflict_resolved: number
  pending_count: number
  failed_count: number
}

export interface PendingChange {
  id: string
  recipe_id: string
  operation: 'create' | 'update' | 'delete'
  timestamp: number
  data: Partial<RecipeLocal>
  device_id: string
  retry_count: number
  max_retries: number
  last_error?: string
  last_retry?: number
  backoff_ms?: number
}

export interface ConflictLog {
  id: string
  recipe_id: string
  timestamp: number
  local_version: RecipeLocal
  remote_version: RecipeLocal
  resolution_strategy: 'local_wins' | 'remote_wins' | 'manual'
  resolved_version: RecipeLocal
  device_id: string
}

export interface ValidationError {
  field: string
  message: string
  value: any
}

export interface DeviceRegistry {
  id: string
  user_id: string
  device_id: string
  device_name?: string
  last_sync: number
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
  recipe_id: string
  status: 'processing' | 'completed' | 'failed'
}
