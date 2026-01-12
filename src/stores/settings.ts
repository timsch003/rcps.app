import { defineStore } from 'pinia'

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    theme: 'dark',
  }),
  persist: {
    storage: localStorage,
    key: 'rcps-app-settings',
  },
})
