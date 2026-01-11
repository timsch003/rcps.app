import { defineStore } from 'pinia'

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    theme: 'dark',
  }),
  persist: {
    key: 'rcps-app-settings',
  },
})
