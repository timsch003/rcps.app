import { defineStore } from 'pinia'
import { ref } from 'vue'
import { db } from '@/services/dexie'
import type { RecipeLocal, UUID } from '@/types'

export const useRecipesStore = defineStore('recipes', () => {
  const all = ref<RecipeLocal[]>([])

  async function init() {
    all.value = await db.recipes.toArray()
  }

  async function add(recipe: RecipeLocal): Promise<UUID | undefined> {
    try {
      await db.recipes.add(recipe)
      all.value.push(recipe)
      return recipe.id
    } catch (error) {
      console.error('Failed to add recipe to the local database:', error)
      return undefined
    }
  }

  function getAllWithTag(tagId: string): RecipeLocal[] {
    return all.value.filter((r) => r.tagIds?.includes(tagId))
  }

  function get(id: string): RecipeLocal | undefined {
    return all.value.find((r) => r.id === id)
  }

  function getName(id: string): string {
    const recipe = all.value.find((r) => r.id === id)
    return recipe ? recipe.name : ''
  }

  function nameExists(name: string): boolean {
    return all.value.some((r) => r.name === name)
  }

  return {
    all,
    init,
    add,
    get,
    getAllWithTag,
    getName,
    nameExists,
  }
})
