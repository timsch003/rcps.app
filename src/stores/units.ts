import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Unit } from '@/types'

export const useUnitsStore = defineStore('units', () => {
  const cached = ref<Unit[]>([])

  function cache(unit: Unit): void {
    if (cached.value.some((u) => u.id === unit.id)) return
    cached.value.push(unit)
  }

  function getName(id: Unit['id']): Unit['name'] | undefined {
    const unit = cached.value.find((u) => u.id === id)
    return unit ? unit.name : undefined
  }

  return {
    cached,
    cache,
    getName,
  }
})
