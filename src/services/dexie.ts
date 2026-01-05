import Dexie from 'dexie'
import type {
  RecipeLocal,
  SyncMetadata,
  PendingChange,
  ConflictLog,
  DeviceRegistry,
} from '@/types'
import { validators } from './validators'

export class RecipesDB extends Dexie {
  recipes!: Dexie.Table<RecipeLocal>
  sync_metadata!: Dexie.Table<SyncMetadata>
  pending_changes!: Dexie.Table<PendingChange>
  conflict_logs!: Dexie.Table<ConflictLog>
  device_registry!: Dexie.Table<DeviceRegistry>

  constructor() {
    super('RecipesDB')
    this.version(1).stores({
      recipes: '++id, userId, synced, updated, pending_sync, conflict_detected',
      sync_metadata: 'id',
      pending_changes: '++id, recipe_id, timestamp, retry_count',
      conflict_logs: '++id, recipe_id, timestamp',
      device_registry: '++id, user_id, device_id',
    })
  }
}

export const db = new RecipesDB()

// CRUD with validation
export async function saveToDbValidated(
  recipe: RecipeLocal,
): Promise<{ id: string; errors: any[] }> {
  const errors = validators.validateRecipe(recipe as unknown as Record<string, unknown>)
  if (errors.length > 0) {
    return { id: '', errors }
  }

  try {
    const id = await db.recipes.put(recipe)
    return { id: String(id), errors: [] }
  } catch (e) {
    return {
      id: '',
      errors: [{ field: 'database', message: `Save failed: ${String(e)}`, value: null }],
    }
  }
}

export async function saveToDb(recipe: RecipeLocal): Promise<string> {
  return String(await db.recipes.put(recipe))
}

export async function getRecipeFromDB(id: string): Promise<RecipeLocal | undefined> {
  return db.recipes.get(id)
}

export async function getAllRecipesByUser(userId: string): Promise<RecipeLocal[]> {
  return db.recipes.where('userId').equals(userId).toArray()
}

export async function getPendingRecipesByUser(userId: string): Promise<RecipeLocal[]> {
  return db.recipes
    .where('userId')
    .equals(userId)
    .filter((r) => r.pending_sync)
    .toArray()
}

export async function getConflictedRecipes(userId: string): Promise<RecipeLocal[]> {
  return db.recipes
    .where('userId')
    .equals(userId)
    .filter((r) => r.conflict_detected)
    .toArray()
}

export async function deleteFromDb(id: string): Promise<void> {
  return db.recipes.delete(id)
}

// Sync Metadata
export async function getSyncMetadata(): Promise<SyncMetadata | undefined> {
  return db.sync_metadata.get('recipes')
}

export async function updateSyncMetadata(metadata: Partial<SyncMetadata>): Promise<void> {
  const current =
    (await getSyncMetadata()) ||
    ({
      id: 'recipes',
      last_synced: 0,
      last_conflict_resolved: 0,
      pending_count: 0,
      failed_count: 0,
    } as SyncMetadata)

  await db.sync_metadata.put({ ...current, ...metadata })
}

// Pending Changes Queue
export async function addPendingChange(change: PendingChange): Promise<string> {
  return String(await db.pending_changes.add(change))
}

export async function getPendingChanges(): Promise<PendingChange[]> {
  return db.pending_changes.toArray()
}

export async function getPendingChangesByRecipe(recipeId: string): Promise<PendingChange[]> {
  return db.pending_changes.where('recipe_id').equals(recipeId).toArray()
}

export async function removePendingChange(id: string): Promise<void> {
  return db.pending_changes.delete(id)
}

export async function updatePendingChange(
  id: string,
  updates: Partial<PendingChange>,
): Promise<void> {
  await db.pending_changes.update(id, updates)
}

// Conflict Logs (Audit Trail)
export async function logConflict(conflict: ConflictLog): Promise<string> {
  return String(await db.conflict_logs.add(conflict))
}

export async function getConflictLogsForRecipe(recipeId: string): Promise<ConflictLog[]> {
  return db.conflict_logs.where('recipe_id').equals(recipeId).toArray()
}

// Device Registry
export async function registerDevice(device: DeviceRegistry): Promise<string> {
  return String(await db.device_registry.add(device))
}

export async function getDevicesForUser(userId: string): Promise<DeviceRegistry[]> {
  return db.device_registry.where('user_id').equals(userId).toArray()
}

// Data Pruning (manage storage)
export async function pruneOldRecipes(
  userId: string,
  ageMs: number = 30 * 24 * 60 * 60 * 1000, // 30 days
): Promise<number> {
  const cutoff = Date.now() - ageMs
  const oldRecipes = await db.recipes
    .where('userId')
    .equals(userId)
    .filter((r) => r.updated < cutoff && r.synced)
    .toArray()

  const ids = oldRecipes.map((r) => r.id)
  await db.recipes.bulkDelete(ids)

  return ids.length
}

export async function getDbStats(): Promise<{
  totalRecipes: number
  pendingChanges: number
  conflictedRecipes: number
  totalSize: number
}> {
  const [recipes, pending, conflicts] = await Promise.all([
    db.recipes.toArray(),
    db.pending_changes.toArray(),
    db.recipes.filter((r) => r.conflict_detected).toArray(),
  ])

  return {
    totalRecipes: recipes.length,
    pendingChanges: pending.length,
    conflictedRecipes: conflicts.length,
    totalSize: JSON.stringify(recipes).length + JSON.stringify(pending).length,
  }
}
