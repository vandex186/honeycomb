import { resolve } from 'path'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  build: {
    target: 'esnext',
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'Honeycomb',
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: 'all',
    hmr: {
      port: 5173,
    },
  },
  plugins: [dts({ tsconfigPath: 'tsconfig.build.json' })],
})
