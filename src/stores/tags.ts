import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { db } from '@/services/dexie'
import { v7 as uuid } from 'uuid'
import type { Tag, UUID } from '@/types'

export const useTagsStore = defineStore('tags', () => {
  const all = ref<Tag[]>([])
  const names = computed(() => all.value.map((t) => t.name))

  async function init() {
    all.value = await db.tags.toArray()
  }

  async function add(name: string): Promise<UUID> {
    const existing = await db.tags.where('name').equals(name).first()
    if (existing) {
      return existing.id
    }

    const newTag: Tag = {
      id: uuid(),
      name,
    }

    all.value.push(newTag)
    await db.tags.add(newTag)
    return newTag.id
  }

  return {
    all,
    names,
    init,
    add,
  }
})
