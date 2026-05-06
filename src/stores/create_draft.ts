import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ImportedRecipeDraft } from '@/types'

export const useCreateDraftStore = defineStore('createDraft', () => {
  const importedRecipeDraft = ref<ImportedRecipeDraft | null>(null)

  function setImportedRecipeDraft(draft: ImportedRecipeDraft): void {
    importedRecipeDraft.value = draft
  }

  function consumeImportedRecipeDraft(): ImportedRecipeDraft | null {
    const draft = importedRecipeDraft.value
    importedRecipeDraft.value = null
    return draft
  }

  return {
    importedRecipeDraft,
    setImportedRecipeDraft,
    consumeImportedRecipeDraft,
  }
})
