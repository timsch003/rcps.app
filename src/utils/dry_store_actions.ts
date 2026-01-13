import { db } from '@/services/dexie'
import { v7 as uuidv7 } from 'uuid'
import type { IdAndName } from '@/types'
import type { Ref } from 'vue'

export async function add(
  name: IdAndName['name'],
  id: IdAndName['id'] = uuidv7(),
  storeAll: Ref<IdAndName[]>,
  storeId: 'ingredients' | 'tags' | 'units',
) {
  const existing = await db.table(storeId).where('name').equals(name).first()
  if (existing) return

  const newItem: IdAndName = { id, name }

  storeAll.value.push(newItem)

  try {
    await db[storeId].add(newItem)
  } catch (error) {
    console.error(`Failed to add ${storeId.slice(0, -1)} to the database:`, error)
  }
}
