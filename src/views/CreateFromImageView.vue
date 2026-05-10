<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCreateDraftStore } from '@/stores/create_draft'
import { importFromImages } from '@/services/image_import'
import ButtonMulti from '@/views/components/ButtonMulti.vue'
import { t } from '@/lang/i18n'
import SpinnerIcon from '@/views/icons/IconSpinner.vue'
import XIcon from '@/views/icons/IconX.vue'
import ArrowRight from '@/views/icons/IconArrowRight.vue'

const router = useRouter()
const createDraftStore = useCreateDraftStore()

const selectedFiles = ref<File[]>([])
const processing = ref(false)
const errorMessage = ref('')

const canImport = computed(() => selectedFiles.value.length > 0 && !processing.value)

function onFilesChange(e: Event) {
  const input = e.target as HTMLInputElement
  selectedFiles.value = input.files ? Array.from(input.files) : []
}

async function onImportFromImage() {
  if (!canImport.value) return

  processing.value = true
  errorMessage.value = ''

  try {
    const imported = await importFromImages(selectedFiles.value)
    createDraftStore.setImportedRecipeDraft(imported)
    router.replace({ name: 'create' })
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : t('unknown_error')
  } finally {
    processing.value = false
  }
}
</script>

<template>
  <div class="transition-navs-out-view">
    <ButtonMulti
      class="create_from_image__discard-button"
      :icon="XIcon"
      :desc="t('create_edit.discard')"
      showDesc
      @click="router.back()"
    />

    <h2 id="create_from_image-heading" class="heading--root">
      {{ t('create_from_image.heading') }}
    </h2>

    <input
      id="create_from_image__files"
      type="file"
      accept="image/*"
      multiple
      @change="onFilesChange"
      aria-labelledby="create_from_image-heading"
    />

    <p v-if="selectedFiles.length" class="create_from_image__selected-files multiline_text">
      {{ selectedFiles.map((file) => file.name).join('\n') }}
    </p>

    <div class="submit">
      <ButtonMulti
        :desc="t('Import')"
        :icon="ArrowRight"
        showDesc
        :disabled="!canImport"
        @click="onImportFromImage"
      />
      <SpinnerIcon v-if="processing" />
    </div>

    <p v-if="errorMessage" class="error">{{ t('error') }}: {{ errorMessage }}</p>
  </div>
</template>

<style scoped>
.create_from_image__discard-button,
#create_from_image__files,
.create_from_image__selected-files {
  margin: 0;
  margin-bottom: var(--inner-spacing-m);
}

.create_from_image__selected-files {
  max-width: 100%;
  overflow-wrap: anywhere;
}
</style>
