import Dexie from 'dexie'
import type { Ingredient, RecipeIngredient, RecipeLocal, Tag, Unit } from '@/types'

export class RcpsAppUserDb extends Dexie {
  ingredients!: Dexie.Table<Ingredient>
  recipe_ingredients!: Dexie.Table<RecipeIngredient>
  recipes!: Dexie.Table<RecipeLocal>
  tags!: Dexie.Table<Tag>
  units!: Dexie.Table<Unit>

  constructor() {
    super('RcpsAppUserDb')
    this.version(1).stores({
      ingredients: 'id, &name',
      recipe_ingredients: 'id, [id+recipeId], [recipeId+id]',
      recipes:
        '&id, &name, *tagIds, favorite, recipeIngredientIds, instructions, notes, synced, pendingSync',
      tags: 'id, &name',
      units: 'id, &name',
    })
  }
}

export const db = new RcpsAppUserDb()
