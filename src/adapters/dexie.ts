import Dexie from 'dexie'
import type {
  Ingredient,
  RecipeIngredient,
  RecipeLocal,
  Tag,
  Unit,
  PendingChange,
  SyncMetadata,
} from '@/types'

export class RcpsAppUserDb extends Dexie {
  ingredients!: Dexie.Table<Ingredient>
  recipe_ingredients!: Dexie.Table<RecipeIngredient>
  recipes!: Dexie.Table<RecipeLocal>
  tags!: Dexie.Table<Tag>
  units!: Dexie.Table<Unit>
  pending_changes!: Dexie.Table<PendingChange>
  sync_metadata!: Dexie.Table<SyncMetadata>

  constructor() {
    super('RcpsAppUserDb')
    this.version(1).stores({
      ingredients: 'id, &name',
      recipe_ingredients: 'id, [id+recipeId], [recipeId+id]',
      recipes: '&id, &name, tagIds, recipeIngredientIds, instructions, notes, synced, pendingSync',
      tags: 'id, &name',
      units: 'id, &name',
      pending_changes: 'id',
      sync_metadata: 'id',
    })
  }
}

export const db = new RcpsAppUserDb()

export async function getPendingRecipes(userId: string): Promise<RecipeLocal[]> {
  return db.recipes
    .where('userId')
    .equals(userId)
    .filter((r) => r.synced === false)
    .toArray()
}

export async function getSyncMetadata(): Promise<SyncMetadata | undefined> {
  return db.sync_metadata.get('recipes')
}

export async function updateSyncMetadata(metadata: SyncMetadata): Promise<void> {
  const current =
    (await getSyncMetadata()) ||
    ({
      lastSync: 0,
      pendingChanges: 0,
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
