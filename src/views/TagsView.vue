<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useTagsStore } from '@/stores/tags'
import { t } from '@/lang/i18n'
import CardsGrid from '@/views/components/CardsGrid.vue'

const tagsStore = useTagsStore()
const transitionName = useRoute().meta.transition as string
</script>

<template>
  <Transition :name="transitionName" appear>
    <div>
      <h2 class="heading--root">{{ t('Tags') }}</h2>
      <CardsGrid :tags="tagsStore.cached" />
    </div>
  </Transition>
</template>
