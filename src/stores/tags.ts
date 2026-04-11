import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Tag } from '@/types'

export const useTagsStore = defineStore('tags', () => {
  const cached = ref<Tag[]>([])

  function cache(tag: Tag): void {
    if (cached.value.some((t) => t.id === tag.id)) return
    cached.value.push(tag)
  }

  function getName(id: Tag['id']): Tag['name'] | undefined {
    const tag = cached.value.find((t) => t.id === id)
    return tag ? tag.name : undefined
  }

  function getNames(ids: Tag['id'][]) {
    return cached.value.filter((t) => ids.includes(t.id)).map((t) => t.name)
  }

  function getExistingId(name: Tag['name']) {
    const tag = cached.value.find((t) => t.name === name)
    return tag ? tag.id : undefined
  }

  return {
    cached,
    cache,
    getExistingId,
    getName,
    getNames,
  }
})
