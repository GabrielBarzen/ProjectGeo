import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import mkcert from 'vite-plugin-mkcert'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    outDir: "../../../projectgeo/build/resources/main/static/",
    sourcemap: 'inline'
  },
  plugins: [svelte({
    compilerOptions: {
      dev: true
    }
  }), mkcert()],

})
