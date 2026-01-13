import { defineStore } from 'pinia'
import { ref } from 'vue'
import { db } from '@/services/dexie'
import { v7 as uuidv7 } from 'uuid'
import type { RecipeLocal, UUID } from '@/types'

export const useRecipesStore = defineStore('recipes', () => {
  const all = ref<RecipeLocal[]>([])

  async function init() {
    all.value = await db.recipes.toArray()
  }

  async function add(recipe: Omit<RecipeLocal, 'id' | 'synced'>, id?: UUID) {
    const newRecipe: RecipeLocal = {
      id: id || uuidv7(),
      ...recipe,
      synced: false,
    }
    all.value.push(newRecipe)
    try {
      await db.recipes.add(newRecipe)
    } catch (error) {
      console.error('Failed to add recipe to the database:', error)
    }
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
    add,
    get,
    getAllWithTag,
  }
})
