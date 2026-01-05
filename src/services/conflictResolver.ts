import type {
  RecipeLocal,
  ConflictLog,
  ConflictResolutionStrategy,
  ConflictResolution,
} from '@/types'
import { db } from './dexie'
import { getOrCreateDeviceId, generateUuid } from '@/utils/uuid'

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

    const merged: any = { ...local }

    // Check each field
    const fieldsToCheck = ['name', 'instructions', 'notes']

    for (const field of fieldsToCheck) {
      const originalValue = (original as any)[field]
      const localValue = (local as any)[field]
      const remoteValue = (remote as any)[field]

      // No conflict: one side didn't change
      if (localValue === originalValue) {
        merged[field] = remoteValue
      } else if (remoteValue === originalValue) {
        merged[field] = localValue
      } else if (localValue === remoteValue) {
        // Both changed to same value
        merged[field] = localValue
      } else {
        // Both changed differently → conflict
        conflicts.push(field)
        // For now, prefer local, but mark for review
        merged[field] = localValue
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
          device_id: deviceId,
        }
        if (local.updated < remote.updated) {
          conflicts.push('timestamp_overridden')
        }
        break
      }

      case 'remote-preferred': {
        resolved = {
          ...remote,
          device_id: deviceId,
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
          resolved = local.device_id <= remote.device_id ? local : remote
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
      recipe_id: recipeId,
      timestamp: Date.now(),
      local_version: local,
      remote_version: remote,
      resolution_strategy: resolution.strategy as 'local_wins' | 'remote_wins' | 'manual',
      resolved_version: resolution.resolved,
      device_id: getOrCreateDeviceId(),
    }

    await db.conflict_logs.add(log)
  }
}
