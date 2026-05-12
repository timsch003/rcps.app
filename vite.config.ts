import { fileURLToPath, URL } from 'node:url'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// Plugin to generate asset manifest for service worker caching
function generateAssetManifest() {
  return {
    name: 'generate-asset-manifest',
    writeBundle(options: { dir?: string }, bundle: Record<string, unknown>) {
      const assets = Object.keys(bundle)
        .filter((name) => name.startsWith('assets/'))
        .map((name) => `/` + name)

      const manifestPath = resolve(options.dir || 'pb_public', 'asset-manifest.json')
      writeFileSync(manifestPath, JSON.stringify(assets, null, 2))
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueDevTools(), generateAssetManifest()],
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
