import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { db } from '@/services/dexie'
import type { Unit } from '@/types'

const STORE_ID = 'units'

export const useUnitsStore = defineStore(STORE_ID, () => {
  const all = ref<Unit[]>([])
  const names = computed(() => all.value.map((t) => t.name))

  async function init() {
    all.value = await db.units.toArray()
  }

  async function add(name: Unit['name'], id?: Unit['id']) {
    // TODO
  }

  function getName(id: Unit['id']): Unit['name'] | undefined {
    const unit = all.value.find((u) => u.id === id)
    return unit ? unit.name : undefined
  }

  return {
    all,
    names,
    init,
    add,
    getName,
  }
})
