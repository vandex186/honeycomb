import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  server: {
    allowedHosts: [
      '5173-vandex186-honeycomb-t0d5g9h8jae.ws-us120.gitpod.io',
    ],
    host: true,
  },
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
});
