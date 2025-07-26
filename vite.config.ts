import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  server: {
    allowedHosts: ['all', '5173-vandex186-honeycomb-ty6snb30l85.ws-us120.gitpod.io'], // Allow all + specific Gitpod host
    host: true, // Enable external access (needed for Gitpod URLs)
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
