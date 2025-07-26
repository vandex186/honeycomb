import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

const __dirname = dirname(fileURLToPath(import.meta.url));

const workspaceUrl = process.env.GITPOD_WORKSPACE_URL || 'https://vandex186-honeycomb-vjhec9j9f3ws-us120.gitpod.io';
const allowedHost = workspaceUrl.replace(/https?:\/\//, '');
console.log('Resolved allowedHost:', allowedHost);

export default defineConfig({
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    hmr: {
      port: 5173,
    },
<<<<<<< HEAD
    allowedHosts: process.env.GITPOD_WORKSPACE_URL ? [process.env.GITPOD_WORKSPACE_URL] : ['5173-vandex186-honeycomb-t0d5g9h8jae.ws-us120.gitpod.io'],
=======
    allowedHosts: [allowedHost],
>>>>>>> f7f535140d58ad9cca1e2b29662469835fe16725
  },
  build: {
    target: 'esnext',
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'Honeycomb',
    },
  },
  plugins: [dts({ tsconfigPath: 'tsconfig.build.json' })],
});
