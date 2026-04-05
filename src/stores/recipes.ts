import { defineStore } from 'pinia'
import { ref } from 'vue'
import { recipesManager } from '@/services/recipes_manager'
import type { RecipeLocal, RecipeRaw, UUID } from '@/types'

export const useRecipesStore = defineStore('recipes', () => {
  const all = ref<RecipeLocal[]>([])

  async function init() {
    all.value = await recipesManager.getAll()
  }

  async function add(data: RecipeRaw): Promise<UUID | undefined> {
    const addedRecipe = await recipesManager.add(data)
    if (!addedRecipe) return undefined
    all.value.push(addedRecipe)
    return addedRecipe.id
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
