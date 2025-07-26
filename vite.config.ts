import { resolve } from 'path'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  server: {
    allowedHosts: 'all', // 🔥 Allow all external hosts (safe for Gitpod dev)
    host: true,          // Enable external access (needed for Gitpod URLs)
  },
  build: {
    target: 'esnext',
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'Honeycomb',
    },
  },
  plugins: [dts({ tsconfigPath: 'tsconfig.build.json' })],
})
