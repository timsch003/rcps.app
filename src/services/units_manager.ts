import { db } from '@/adapters/dexie'
import type { Unit, UUID } from '@/types'
import { v7 as uuidv7 } from 'uuid'

async function getAll(): Promise<Unit[]> {
  return await db.units.toArray()
}

async function add(name: Unit['name'], id?: Unit['id']): Promise<UUID | undefined> {
  const newItem: Unit = { id: id ?? uuidv7(), name }

  const existsInDb = await db.units.where('name').equals(name).first()
  if (existsInDb) return undefined

  try {
    await db.units.add(newItem)
  } catch (error) {
    console.error('Failed to add unit to the local database:', error)
    return undefined
  }

  return newItem.id
}

export const unitsManager = {
  getAll,
  add,
}
