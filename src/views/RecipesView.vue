<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRecipesStore } from '@/stores/recipes'
import { useSyncStore } from '@/stores/sync'
import { useAuthStore } from '@/stores/auth'
import { useRecipes } from '@/composables/useRecipes'
import { useOnlineStatus } from '@/composables/useOnlineStatus'
import type { RecipeLocal } from '@/types'

const recipesStore = useRecipesStore()
const syncStore = useSyncStore()
const authStore = useAuthStore()
const { initializeRecipes, editRecipe, addRecipe, removeRecipe } = useRecipes()
const { isOnline } = useOnlineStatus()

// Derived states
const sortedRecipes = computed(() => {
  return [...recipesStore.recipes].sort((a: RecipeLocal, b: RecipeLocal) => {
    // Pending and conflicted recipes first
    if (a.pendingSync !== b.pendingSync) {
      return a.pendingSync ? -1 : 1
    }
    if (a.conflictDetected !== b.conflictDetected) {
      return a.conflictDetected ? -1 : 1
    }
    return b.updated - a.updated
  })
})

const syncSummary = computed(() => ({
  total: recipesStore.recipes.length,
  pending: recipesStore.unsyncedRecipes.length,
  conflicts: recipesStore.conflictedRecipes.length,
  errors: recipesStore.errorRecipes.length,
}))

function getRecipeStatus(recipe: RecipeLocal): {
  state: string
  icon: string
  color: string
  message: string
} {
  if (recipe.conflictDetected) {
    return {
      state: 'conflict',
      icon: '⚠️',
      color: 'orange',
      message: 'Conflicting changes - review required',
    }
  }

  if (recipe.syncError) {
    return {
      state: 'error',
      icon: '❌',
      color: 'red',
      message: `Sync failed: ${recipe.syncError}`,
    }
  }

  if (recipe.pendingSync) {
    return {
      state: 'pending',
      icon: '⏳',
      color: 'yellow',
      message: `Pending sync (attempt ${recipe.retryCount + 1})`,
    }
  }

  return {
    state: 'synced',
    icon: '✓',
    color: 'green',
    message: 'Synced',
  }
}

function formatTime(ms: number): string {
  return new Date(ms).toLocaleTimeString()
}

onMounted(async () => {
  if (authStore.isAuth) {
    await initializeRecipes()
  }
})

async function handleEdit(recipeId: string, updates: Partial<RecipeLocal>) {
  await editRecipe(recipeId, updates)
}

async function handleDelete(recipeId: string) {
  if (confirm('Delete this recipe?')) {
    await removeRecipe(recipeId)
  }
}

async function handleAddRecipe() {
  await addRecipe({
    userId: authStore.user!.id,
    name: 'New Recipe',
    instructions: 'Add your instructions here',
  })
}
</script>

<template>
  <div class="recipes-container">
    <!-- Status Bar -->
    <div class="status-bar" :class="{ offline: !isOnline }">
      <div class="status-info">
        <span v-if="!isOnline" class="status-badge offline">
          🔴 OFFLINE - Changes will sync when back online
        </span>
        <span v-else-if="syncStore.state === 'syncing'" class="status-badge syncing">
          🔄 Syncing...
        </span>
        <span v-else-if="syncStore.state === 'conflict'" class="status-badge conflict">
          ⚠️ CONFLICT - Please review changes
        </span>
        <span v-else class="status-badge online">
          🟢 Online - Last sync: {{ formatTime(syncStore.lastSyncTime) }}
        </span>
      </div>

      <div class="sync-summary">
        <span v-if="syncSummary.pending > 0" class="badge pending">
          {{ syncSummary.pending }} pending
        </span>
        <span v-if="syncSummary.conflicts > 0" class="badge conflict">
          {{ syncSummary.conflicts }} conflicts
        </span>
        <span v-if="syncSummary.errors > 0" class="badge error">
          {{ syncSummary.errors }} errors
        </span>
      </div>
    </div>

    <!-- Error Messages -->
    <div v-if="recipesStore.lastError" class="alert alert-error">
      {{ recipesStore.lastError }}
      <button @click="recipesStore.clearErrors()">Dismiss</button>
    </div>

    <!-- Sync Progress -->
    <div v-if="syncStore.progress" class="sync-progress">
      <div class="progress-bar">
        <div class="progress-fill" :style="{
          width: ((syncStore.progress.current / syncStore.progress.total) * 100).toString() + '%',
        }"></div>
      </div>
      <p>Syncing {{ syncStore.progress.current }}/{{ syncStore.progress.total }}</p>
    </div>

    <!-- Add Recipe Button -->
    <div class="actions-bar">
      <button @click="handleAddRecipe" class="btn-primary">Add New Recipe</button>
    </div>

    <!-- Recipes Grid -->
    <div class="recipes-grid">
      <div v-for="recipe in sortedRecipes" :key="recipe.id" class="recipe-card"
        :class="[getRecipeStatus(recipe).state]">
        <div class="recipe-header">
          <h3>{{ recipe.name }}</h3>
          <span class="status-icon" :title="getRecipeStatus(recipe).message">
            {{ getRecipeStatus(recipe).icon }}
          </span>
        </div>

        <p class="recipe-content">{{ recipe.instructions || 'No instructions yet' }}</p>

        <div class="recipe-meta">
          <small v-if="recipe.pendingSync" class="meta-item pending"> ⏳ Pending sync </small>
          <small v-if="recipe.conflictDetected" class="meta-item conflict">
            ⚠️ Conflict detected
          </small>
          <small v-if="recipe.syncError" class="meta-item error">
            {{ recipe.syncError }}
          </small>
          <small class="meta-item"> Updated: {{ formatTime(recipe.updated) }} </small>
        </div>

        <div class="recipe-actions">
          <button @click="handleEdit(recipe.id, { name: recipe.name + ' (edited)' })">Edit</button>
          <button @click="handleDelete(recipe.id)" class="btn-danger">Delete</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.recipes-container {
  padding: 1rem;
  max-width: 1400px;
  margin: 0 auto;
}

.status-bar {
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.status-bar.offline {
  background: #fff3cd;
  border-color: #ffc107;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.9rem;
  font-weight: 500;
}

.status-badge.offline {
  background: #ff9800;
  color: white;
}

.status-badge.syncing {
  background: #2196f3;
  color: white;
}

.status-badge.conflict {
  background: #ff9800;
  color: white;
}

.status-badge.online {
  background: #4caf50;
  color: white;
}

.sync-summary {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.badge {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 500;
}

.badge.pending {
  background: #fff3cd;
  color: #856404;
}

.badge.conflict {
  background: #ff9800;
  color: white;
}

.badge.error {
  background: #f44336;
  color: white;
}

.sync-progress {
  margin-bottom: 1rem;
}

.progress-bar {
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  background: #4caf50;
  transition: width 0.3s ease;
}

.actions-bar {
  margin-bottom: 1rem;
}

.btn-primary {
  background: #2196f3;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  transition: background 0.2s;
}

.btn-primary:hover {
  background: #1976d2;
}

.recipes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.recipe-card {
  border: 2px solid #ddd;
  border-radius: 8px;
  padding: 1.5rem;
  transition: all 0.3s ease;
  background: white;
}

.recipe-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.recipe-card.pending {
  border-color: #ffc107;
  background: #fffbf0;
}

.recipe-card.conflict {
  border-color: #ff9800;
  background: #fff3e0;
}

.recipe-card.error {
  border-color: #f44336;
  background: #ffebee;
}

.recipe-card.synced {
  border-color: #4caf50;
}

.recipe-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.recipe-header h3 {
  margin: 0;
  font-size: 1.25rem;
  color: #333;
}

.status-icon {
  font-size: 1.5rem;
  cursor: help;
}

.recipe-content {
  margin: 1rem 0;
  color: #666;
  font-size: 0.95rem;
  line-height: 1.5;
}

.recipe-meta {
  margin: 1rem 0;
  font-size: 0.85rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.meta-item {
  color: #888;
}

.meta-item.pending {
  color: #ff9800;
  font-weight: 500;
}

.meta-item.conflict {
  color: #ff5722;
  font-weight: 500;
}

.meta-item.error {
  color: #f44336;
  font-weight: 500;
}

.recipe-actions {
  margin-top: 1rem;
  display: flex;
  gap: 0.5rem;
}

.recipe-actions button {
  flex: 1;
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.recipe-actions button:hover {
  background: #f5f5f5;
}

.btn-danger {
  border-color: #f44336 !important;
  color: #f44336;
}

.btn-danger:hover {
  background: #ffebee !important;
}

.alert {
  padding: 1rem;
  margin-bottom: 1rem;
  border-radius: 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.alert-error {
  background: #ffebee;
  border: 1px solid #f44336;
  color: #c62828;
}

.alert button {
  background: transparent;
  border: none;
  color: inherit;
  cursor: pointer;
  text-decoration: underline;
  font-size: 0.9rem;
}

.db-stats {
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid #ddd;
  text-align: center;
  color: #999;
}
</style>
