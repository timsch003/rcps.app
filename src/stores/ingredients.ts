import { defineStore } from 'pinia'
import { ref } from 'vue'
import { db } from '@/services/dexie'
import { add as addDry } from '@/utils/dry_store_actions'
import type { IdAndName, Ingredient } from '@/types'

const STORE_ID = 'ingredients'

export const useIngredientsStore = defineStore(STORE_ID, () => {
  const all = ref<Ingredient[]>([])

  async function init() {
    all.value = await db.ingredients.toArray()
  }

  async function add(name: IdAndName['name'], id?: IdAndName['id']) {
    await addDry(name, id, all, STORE_ID)
  }

  function getName(id: Ingredient['id']): Ingredient['name'] | undefined {
    const ingredient = all.value.find((ing) => ing.id === id)
    return ingredient ? ingredient.name : undefined
  }

  return {
    all,
    init,
    add,
    getName,
  }
})
