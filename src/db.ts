import { Dexie, type EntityTable } from 'dexie'
import type { Recipe } from './types'

const db = new Dexie('rcpsApp') as Dexie & {
  userId: number
  recipes: EntityTable<Recipe, 'id'>
}

// Schema declaration:
db.version(1).stores({
  recipes: '++id, name, age', // primary key "id" (for the runtime!)
})

export type { Recipe }
export { db }
