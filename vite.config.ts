import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueDevTools()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,

    fs: {
      deny: ['.env', '.env.*', '*.{crt,pem}', '**/.git/**', 'pocketbase?(.bin)'],
    },
  },
  optimizeDeps: {
    exclude: ['pocketbase'],
  },

  build: {
    outDir: 'pb_public',
  },
})
