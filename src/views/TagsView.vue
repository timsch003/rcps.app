<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useTagsStore } from '@/stores/tags'
import { t } from '@/lang/i18n'
import CardsGrid from '@/views/components/CardsGrid.vue'

const tagsStore = useTagsStore()
const transitionName = useRoute().meta.transition as string

onMounted(() => {
  scrollTo(0, 0)
})
</script>

<template>
  <Transition :name="transitionName" class="slide-in-appear" appear>
    <div>
      <h2 class="heading--root">{{ t('Tags') }}</h2>
      <CardsGrid :tags="tagsStore.cached" />
    </div>
  </Transition>
</template>
