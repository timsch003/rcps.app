import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Ingredient } from '@/types'

export const useIngredientsStore = defineStore('ingredients', () => {
  const cached = ref<Ingredient[]>([])

  function cache(ingredient: Ingredient): void {
    if (cached.value.some((ing) => ing.id === ingredient.id)) return
    cached.value.push(ingredient)
  }

  function getId(name: Ingredient['name']): Ingredient['id'] | undefined {
    const ingredient = cached.value.find((ing) => ing.name === name)
    return ingredient ? ingredient.id : undefined
  }

  function getName(id: Ingredient['id']): Ingredient['name'] | undefined {
    const ingredient = cached.value.find((ing) => ing.id === id)
    return ingredient ? ingredient.name : undefined
  }

  return {
    cached,
    cache,
    getId,
    getName,
  }
})
