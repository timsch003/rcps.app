import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { db } from '@/services/dexie'
import { add as addDry } from '@/utils/dry_store_actions'
import type { IdAndName, Unit } from '@/types'

const STORE_ID = 'units'

export const useUnitsStore = defineStore(STORE_ID, () => {
  const all = ref<Unit[]>([])
  const names = computed(() => all.value.map((t) => t.name))

  async function init() {
    all.value = await db.units.toArray()
  }

  async function add(name: IdAndName['name'], id?: IdAndName['id']) {
    await addDry(name, id, all, STORE_ID)
  }

  return {
    all,
    names,
    init,
    add,
  }
})
