import { defineStore } from 'pinia'
import { ref } from 'vue'
import { db } from '@/services/dexie'
import type { RecipeLocal } from '@/types'

export const useRecipesStore = defineStore('recipes', () => {
  const all = ref<RecipeLocal[]>([])

  async function init() {
    all.value = await db.recipes.toArray()
  }

  function getAllWithTag(tagId: string): RecipeLocal[] {
    return all.value.filter((r) => r.tagIds?.includes(tagId))
  }

  function get(id: string): RecipeLocal | undefined {
    return all.value.find((r) => r.id === id)
  }

  return {
    all,
    init,
    get,
    getAllWithTag,
  }
})
