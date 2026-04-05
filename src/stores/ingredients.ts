import { defineStore } from 'pinia'
import { ref } from 'vue'
import { ingredientsManager } from '@/services/ingredients_manager'
import type { Ingredient, MatchedIngredient, RecipeIngredient } from '@/types'

const STORE_ID = 'ingredients'

export const useIngredientsStore = defineStore(STORE_ID, () => {
  const all = ref<Ingredient[]>([])

  async function init() {
    all.value = await ingredientsManager.getAll()
  }

  async function add(
    matchedIngredient: MatchedIngredient,
  ): Promise<RecipeIngredient['id'] | undefined> {
    const id = await ingredientsManager.add(matchedIngredient)
    if (id) {
      const ingredient = all.value.find((ing) => ing.id === id)
      if (!ingredient) {
        const newIngredient: Ingredient = { id, name: '' }
        all.value.push(newIngredient)
      }
    }
    return id
  }

  function getId(name: Ingredient['name']): Ingredient['id'] | undefined {
    const ingredient = all.value.find((ing) => ing.name === name)
    return ingredient ? ingredient.id : undefined
  }

  function getName(id: Ingredient['id']): Ingredient['name'] | undefined {
    const ingredient = all.value.find((ing) => ing.id === id)
    return ingredient ? ingredient.name : undefined
  }

  return {
    all,
    init,
    add,
    getId,
    getName,
  }
})
