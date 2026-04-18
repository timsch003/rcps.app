import { defineStore } from 'pinia'

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    theme: 'dark',
    keepScreenOn: true,
  }),
  persist: {
    storage: localStorage,
    key: 'rcps-app-settings',
  },
})
