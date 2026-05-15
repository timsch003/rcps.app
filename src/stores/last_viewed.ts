import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { LAST_VIEWED_STORAGE_KEY } from '@/constants'
import type { LastViewedMap, UUID } from '@/types'

function readFromStorage(): LastViewedMap {
  try {
    const raw = localStorage.getItem(LAST_VIEWED_STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as LastViewedMap
  } catch {
    return {}
  }
}

function writeToStorage(map: LastViewedMap): void {
  localStorage.setItem(LAST_VIEWED_STORAGE_KEY, JSON.stringify(map))
}

export const useLastViewedStore = defineStore('lastViewed', () => {
  const map = ref<LastViewedMap>(readFromStorage())
  const orderedIds = computed<UUID[]>(() =>
    Object.entries(map.value)
      .sort(([, a], [, b]) => b - a)
      .map(([id]) => id),
  )

  function recordView(recipeId: UUID): void {
    map.value = { ...map.value, [recipeId]: Date.now() }
    writeToStorage(map.value)
    void (async () => {
      // Avoid circular dependency by importing sync module dynamically
      const { sync } = await import('@/services/sync')
      await sync.trigger()
    })()
  }

  function removeEntry(recipeId: UUID): void {
    const next = { ...map.value }
    delete next[recipeId]
    map.value = next
    writeToStorage(map.value)
  }

  // Merges remote map using LWW (max timestamp per entry)
  function merge(remote: LastViewedMap): { changes: boolean; merged: LastViewedMap } {
    let changes = false
    const next = { ...map.value }

    for (const [id, timestamp] of Object.entries(remote)) {
      if ((next[id] ?? 0) < timestamp) {
        next[id] = timestamp
        changes = true
      }
    }

    if (changes) {
      map.value = next
      writeToStorage(map.value)
    }
    return { changes, merged: next }
  }

  function getMap(): LastViewedMap {
    return { ...map.value }
  }

  return { map, orderedIds, recordView, removeEntry, merge, getMap }
})
