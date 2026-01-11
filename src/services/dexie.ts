import Dexie from 'dexie'
import type { RecipeLocal, SyncMetadata, PendingChange } from '@/types'

export class RcpsAppUserDb extends Dexie {
  recipes!: Dexie.Table<RecipeLocal>
  account!: Dexie.Table<RecipeLocal>
  settings!: Dexie.Table<RecipeLocal>
  sync_metadata!: Dexie.Table<SyncMetadata>
  pending_changes!: Dexie.Table<PendingChange>

  constructor() {
    super('RcpsAppUserDb')
    this.version(1).stores({
      recipes: '++id, userId, name',
      account: '++id, userId',
      settings: '++id, userId',
      sync_metadata: '++id',
      pending_changes: '++id',
    })
  }
}

export const db = new RcpsAppUserDb()

export async function addRecipe(recipe: RecipeLocal): Promise<string> {
  return db.recipes.put(recipe)
}

export async function getRecipe(id: string): Promise<RecipeLocal | undefined> {
  return db.recipes.get(id)
}

export async function getAllRecipes(userId: string): Promise<RecipeLocal[]> {
  return db.recipes.where('userId').equals(userId).toArray()
}

export async function deleteRecipe(id: string): Promise<void> {
  return db.recipes.delete(id)
}

export async function getPendingRecipes(userId: string): Promise<RecipeLocal[]> {
  return db.recipes
    .where('userId')
    .equals(userId)
    .filter((r) => r.pendingSync)
    .toArray()
}

export async function getSyncMetadata(): Promise<SyncMetadata | undefined> {
  return db.sync_metadata.get('recipes')
}

export async function updateSyncMetadata(metadata: SyncMetadata): Promise<void> {
  const current =
    (await getSyncMetadata()) ||
    ({
      type: 'recipes',
      lastSynced: 0,
      pendingCount: 0,
    } as SyncMetadata)

  await db.sync_metadata.put({ ...current, ...metadata })
}

export async function addPendingChange(change: PendingChange): Promise<string> {
  return String(await db.pending_changes.add(change))
}

export async function getPendingChanges(): Promise<PendingChange[]> {
  return db.pending_changes.toArray()
}

export async function deletePendingChange(id: string): Promise<void> {
  return db.pending_changes.delete(id)
}

export async function updatePendingChange(
  id: string,
  updates: Partial<PendingChange>,
): Promise<void> {
  await db.pending_changes.update(id, updates)
}
