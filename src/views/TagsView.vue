<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useTagsStore } from '@/stores/tags'
import { sync } from '@/services/sync'
import { t } from '@/lang/i18n'
import CardsGrid from '@/views/components/CardsGrid.vue'
import type { SyncResult } from '@/types'

const tagsStore = useTagsStore()

const pulledData = ref<SyncResult>({ success: false })

onMounted(async () => {
  pulledData.value = await sync.pullRemoteData()
  console.log('pull data: ', pulledData.value)
})
</script>

<template>
  <p v-if="pulledData.error" class="error">{{ t('error') }}: {{ pulledData.error }}</p>
  <div v-else>
    <h2 class="heading--root">{{ t('Tags') }}</h2>
    <CardsGrid :tags="tagsStore.cached" />
  </div>
</template>
