import { defineStore } from 'pinia'
import { ref } from 'vue'
import { tagsManager } from '@/services/tags_manager'
import type { Tag, UUID } from '@/types'

const STORE_ID = 'tags'

export const useTagsStore = defineStore(STORE_ID, () => {
  const all = ref<Tag[]>([])

  async function init() {
    all.value = await tagsManager.getAll()
  }

  async function add(name: Tag['name'], id?: Tag['id']): Promise<UUID | undefined> {
    const newId = await tagsManager.add(name, id)
    if (newId) {
      all.value.push({ id: newId, name })
      return newId
    }
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
