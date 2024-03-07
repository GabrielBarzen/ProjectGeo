import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import mkcert from 'vite-plugin-mkcert'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    outDir: "../../../projectgeo/build/resources/main/static/",
    sourcemap: 'inline',
    chunkSizeWarningLimit: 2000,

  },
  plugins: [svelte({
    compilerOptions: {
      dev: true
    }
  }), mkcert()],

})
