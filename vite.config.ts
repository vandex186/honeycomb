import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Extract host from GITPOD_WORKSPACE_URL or use fallback
const workspaceUrl = process.env.GITPOD_WORKSPACE_URL || 'https://default.gitpod.io';
const allowedHost = workspaceUrl.replace(/https?:\/\//, ''); // Remove http:// or https://
console.log('Resolved allowedHost:', allowedHost);

export default defineConfig({
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    hmr: {
      port: 5173,
    },
    allowedHosts: [allowedHost],
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
