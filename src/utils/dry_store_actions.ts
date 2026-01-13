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
  const newItem: IdAndName = { id, name }

  const existsInStore = !!storeAll.value.find((item) => item.name === name)
  if (existsInStore) return
  storeAll.value.push(newItem)

  const existsInDb = !!(await db.table(storeId).where('name').equals(name).first())
  if (existsInDb) return

  try {
    await db[storeId].add(newItem)
  } catch (error) {
    console.error(`Failed to add ${storeId.slice(0, -1)} to the local database:`, error)
  }
}
