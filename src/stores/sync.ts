import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ConflictResolver } from '@/services/conflictResolver'
import { getOrCreateDeviceId } from '@/utils/uuid'
import { updateSyncMetadata } from '@/services/dexie'
import type {
  RecipeLocal,
  SyncMetadata,
  ConflictResolution,
  SyncState,
  SyncProgress,
} from '@/types'

export const useSyncStore = defineStore('sync', () => {
  const lastSyncTime = ref(0)
  const isOnline = ref(navigator.onLine)
  const state = ref<SyncState>('idle')
  const progress = ref<SyncProgress | null>(null)
  const activeConflicts = ref<Map<string, ConflictResolution>>(new Map())
  const syncErrors = ref<Map<string, string>>(new Map())
  const lastError = ref<string | null>(null)

  const deviceId = getOrCreateDeviceId()
  const syncStateReady = computed(
    () => state.value !== 'syncing' && state.value !== 'syncing_batch',
  )
  const hasConflicts = computed(() => activeConflicts.value.size > 0)
  const hasErrors = computed(() => syncErrors.value.size > 0)

  async function resolveConflict(
    recipeId: string,
    local: RecipeLocal,
    remote: RecipeLocal,
    original: RecipeLocal | undefined,
  ): Promise<ConflictResolution> {
    const resolution = ConflictResolver.resolve(
      local,
      remote,
      original,
      'last-write-wins',
      deviceId,
    )
    await ConflictResolver.logResolution(recipeId, local, remote, resolution)
    activeConflicts.value.set(recipeId, resolution)
    return resolution
  }

  async function recordSyncTime() {
    const metadata: SyncMetadata = {
      id: 'recipes',
      last_synced: Date.now(),
      last_conflict_resolved: Date.now(),
      pending_count: 0,
      failed_count: 0,
    }
    await updateSyncMetadata(metadata)
    lastSyncTime.value = Date.now()
  }

  function setSyncProgress(
    current: number,
    total: number,
    recipeId: string,
    status: 'processing' | 'completed' | 'failed',
  ) {
    progress.value = { current, total, recipe_id: recipeId, status }
  }

  function clearSyncProgress() {
    progress.value = null
  }

  function addSyncError(recipeId: string, error: string) {
    syncErrors.value.set(recipeId, error)
    lastError.value = error
  }

  function clearSyncError(recipeId: string) {
    syncErrors.value.delete(recipeId)
  }

  function resetSyncState() {
    state.value = 'idle'
    progress.value = null
    syncErrors.value.clear()
    lastError.value = null
  }

  return {
    lastSyncTime,
    isOnline,
    state,
    progress,
    activeConflicts,
    syncErrors,
    lastError,
    deviceId,
    syncStateReady,
    hasConflicts,
    hasErrors,
    resolveConflict,
    recordSyncTime,
    setSyncProgress,
    clearSyncProgress,
    addSyncError,
    clearSyncError,
    resetSyncState,
  }
})
