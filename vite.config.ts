import { cloudflare } from '@cloudflare/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  resolve: {
    alias: { '~': resolve(__dirname, 'app') },
  },
  build: {
    rollupOptions: {
      external: ['cloudflare:workers'],
    },
  },
  plugins: [
    tailwindcss(),
    // viteEnvironment.name must match TanStack Start's SSR env name: 'server'
    cloudflare({ viteEnvironment: { name: 'server' } }),
    tanstackStart({ srcDirectory: 'app' }),
    react(),
  ],
});
