import { ref } from 'vue'
import { db } from '@/adapters/dexie'
import { useUnitsStore } from '@/stores/units'
import { normalizeName } from '@/utils/normalize_name'
import { v7 as uuidv7 } from 'uuid'
import type { Unit, UUID } from '@/types'

const cached = ref<Unit[]>([])

async function addOrGetExisting(unitName: Unit['name']): Promise<UUID | undefined> {
  const unitsStore = useUnitsStore()
  const normalizedUnitName = normalizeName(unitName)

  const existingUnitInStore = unitsStore.cached.find((u) => u.name === normalizedUnitName)
  if (existingUnitInStore) return existingUnitInStore.id

  const existingUnitInDb = await db.units.where('name').equals(normalizedUnitName).first()
  if (existingUnitInDb) return existingUnitInDb.id

  const newUnit: Unit = {
    id: uuidv7(),
    name: normalizedUnitName,
  }

  const newUnitId = await db.units.add(newUnit)
  if (newUnitId) unitsStore.cache(newUnit)
  return newUnitId
}

async function cacheAll(): Promise<void> {
  useUnitsStore().cached = await db.units.toArray()
}

function getNameById(unitId: UUID): Unit['name'] | undefined {
  const unit = useUnitsStore().cached.find((u) => u.id === unitId)
  return unit ? unit.name : undefined
}

export const unitsManager = {
  cached,
  addOrGetExisting,
  cacheAll,
  getNameById,
}
