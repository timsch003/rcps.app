<script setup lang="ts">
import { provide } from 'vue'
import { sync } from '@/services/sync'

const syncStatus = sync.status
provide('syncStatus', syncStatus)
</script>

<template>
  <RouterView />
</template>
