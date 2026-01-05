import { setRecipeLocalField } from '@/types'
import { db } from './dexie'
import { getOrCreateDeviceId, generateUuid } from '@/utils/uuid'
import type {
  RecipeLocal,
  ConflictLog,
  ConflictResolutionStrategy,
  ConflictResolution,
} from '@/types'

export class ConflictResolver {
  /**
   * Three-way merge: original → local and original → remote
   * Detects field-level conflicts
   */
  static threeWayMerge(
    original: RecipeLocal | undefined,
    local: RecipeLocal,
    remote: RecipeLocal,
  ): { merged: RecipeLocal; conflicts: string[] } {
    const conflicts: string[] = []

    // If no original, fall back to LWW
    if (!original) {
      return {
        merged: remote.updated > local.updated ? remote : local,
        conflicts: [],
      }
    }

    const merged = { ...local }

    // Check each field
    const fieldsToCheck: Array<keyof RecipeLocal> = ['name', 'instructions', 'notes']

    for (const field of fieldsToCheck) {
      const originalValue = original[field]
      const localValue = local[field]
      const remoteValue = remote[field]

      // No conflict: one side didn't change
      if (localValue === originalValue) {
        setRecipeLocalField(merged, field, remoteValue)
      } else if (remoteValue === originalValue) {
        setRecipeLocalField(merged, field, localValue)
      } else if (localValue === remoteValue) {
        // Both changed to same value
        setRecipeLocalField(merged, field, localValue)
      } else {
        // Both changed differently → conflict
        conflicts.push(field)
        // For now, prefer local, but mark for review
        setRecipeLocalField(merged, field, localValue)
      }
    }

    return { merged, conflicts }
  }

  /**
   * Resolve conflict using selected strategy
   */
  static resolve(
    local: RecipeLocal,
    remote: RecipeLocal,
    original: RecipeLocal | undefined,
    strategy: ConflictResolutionStrategy = 'last-write-wins',
    deviceId: string = getOrCreateDeviceId(),
  ): ConflictResolution {
    let resolved: RecipeLocal
    const conflicts: string[] = []

    switch (strategy) {
      case 'local-preferred': {
        resolved = {
          ...local,
          updated: Math.max(local.updated, remote.updated),
          deviceId: deviceId,
        }
        if (local.updated < remote.updated) {
          conflicts.push('timestamp_overridden')
        }
        break
      }

      case 'remote-preferred': {
        resolved = {
          ...remote,
          deviceId: deviceId,
        }
        break
      }

      case 'last-write-wins':
      default: {
        if (remote.updated > local.updated) {
          resolved = remote
        } else if (local.updated > remote.updated) {
          resolved = local
        } else {
          // Same timestamp: prefer local or by device (consistent)
          resolved = local.deviceId <= remote.deviceId ? local : remote
        }
        break
      }
    }

    return {
      strategy,
      resolved,
      conflicts,
    }
  }

  static async logResolution(
    recipeId: string,
    local: RecipeLocal,
    remote: RecipeLocal,
    resolution: ConflictResolution,
  ): Promise<void> {
    const log: ConflictLog = {
      id: generateUuid(),
      recipeId: recipeId,
      timestamp: Date.now(),
      localVersion: local,
      remoteVersion: remote,
      resolutionStrategy: resolution.strategy as 'localWins' | 'remoteWins' | 'manual',
      resolvedVersion: resolution.resolved,
      deviceId: getOrCreateDeviceId(),
    }

    await db.conflict_logs.add(log)
  }
}
