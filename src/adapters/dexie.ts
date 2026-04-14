import Dexie from 'dexie'
import type { Ingredient, RecipeIngredient, RecipeLocal, Tag, Unit, SyncMetadata } from '@/types'

export class RcpsAppUserDb extends Dexie {
  ingredients!: Dexie.Table<Ingredient>
  recipe_ingredients!: Dexie.Table<RecipeIngredient>
  recipes!: Dexie.Table<RecipeLocal>
  tags!: Dexie.Table<Tag>
  units!: Dexie.Table<Unit>
  sync_metadata!: Dexie.Table<SyncMetadata>

  constructor() {
    super('RcpsAppUserDb')
    this.version(3).stores({
      ingredients: 'id, &name',
      recipe_ingredients: 'id, [id+recipeId], [recipeId+id]',
      recipes: '&id, &name, *tagIds, recipeIngredientIds, instructions, notes, synced, pendingSync',
      tags: 'id, &name',
      units: 'id, &name',
      sync_metadata: 'type',
    })
  }
}

export const db = new RcpsAppUserDb()
