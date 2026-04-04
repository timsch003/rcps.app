import { defineStore } from 'pinia'
import { ref } from 'vue'
import { db } from '@/services/dexie'
import { v7 as uuidv7 } from 'uuid'
import type { Tag, UUID } from '@/types'

const STORE_ID = 'tags'

export const useTagsStore = defineStore(STORE_ID, () => {
  const all = ref<Tag[]>([])

  async function init() {
    all.value = await db.tags.toArray()
  }

  async function add(name: Tag['name'], id?: Tag['id']): Promise<UUID | undefined> {
    const newItem: Tag = { id: id ?? uuidv7(), name }

    const existsInDb = await db.table(STORE_ID).where('name').equals(name).first()
    if (existsInDb) return undefined

    const existsInStore = getExistingId(name)
    if (existsInStore) return undefined

    try {
      await db[STORE_ID].add(newItem)
      all.value.push(newItem)
    } catch (error) {
      console.error(`Failed to add ${STORE_ID.slice(0, -1)} to the local database:`, error)
      return undefined
    }

    return newItem.id
  }

  function getName(id: Tag['id']) {
    const tag = all.value.find((t) => t.id === id)
    return tag ? tag.name : ''
  }

  function getNames(ids: Tag['id'][]) {
    return all.value.filter((t) => ids.includes(t.id)).map((t) => t.name)
  }

  function getExistingId(name: Tag['name']) {
    const tag = all.value.find((t) => t.name === name)
    return tag ? tag.id : undefined
  }

  return {
    all,
    init,
    add,
    getExistingId,
    getName,
    getNames,
  }
})
