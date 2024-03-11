import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import mkcert from 'vite-plugin-mkcert'

export default defineConfig({
  build: {
    sourcemap: 'inline',
    chunkSizeWarningLimit: 2000,
  },
  plugins: [sveltekit(
  ), mkcert()],

  test: {
    include: ['src/**/*.{test,spec}.{js,ts}']
  }
});
