import { defineStore } from 'pinia'
import { ref } from 'vue'
import { db } from '@/services/dexie'
import { add as addDry } from '@/utils/dry_store_actions'
import type { IdAndName, Tag } from '@/types'

const STORE_ID = 'tags'

export const useTagsStore = defineStore(STORE_ID, () => {
  const all = ref<Tag[]>([])

  async function init() {
    all.value = await db.tags.toArray()
  }

  async function add(name: IdAndName['name'], id?: IdAndName['id']) {
    await addDry(name, id, all, STORE_ID)
  }

  function getName(id: Tag['id']) {
    const tag = all.value.find((t) => t.id === id)
    return tag ? tag.name : ''
  }

  function getNames(ids: Tag['id'][]) {
    return all.value.filter((t) => ids.includes(t.id)).map((t) => t.name)
  }

  return {
    all,
    init,
    add,
    getName,
    getNames,
  }
})
