import { db } from '@/adapters/dexie'
import type { Tag, UUID } from '@/types'
import { v7 as uuidv7 } from 'uuid'

async function getAll(): Promise<Tag[]> {
  return await db.tags.toArray()
}

async function add(name: Tag['name'], id?: Tag['id']): Promise<UUID | undefined> {
  const newItem: Tag = { id: id ?? uuidv7(), name }

  const existsInDb = await db.tags.where('name').equals(name).first()
  if (existsInDb) return undefined

  try {
    await db.tags.add(newItem)
  } catch (error) {
    console.error('Failed to add tag to the local database:', error)
    return undefined
  }

  return newItem.id
}

export const tagsManager = {
  getAll,
  add,
}
