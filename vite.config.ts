import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

const __dirname = dirname(fileURLToPath(import.meta.url));

const workspaceUrl = process.env.GITPOD_WORKSPACE_URL || '';

// Extract the hostname from Gitpod workspace URL
const getGitpodHost = () => {
  if (!workspaceUrl) return '';
  try {
    const url = new URL(workspaceUrl);
    return url.hostname;
  } catch {
    return workspaceUrl.replace(/https?:\/\//, '');
  }
};

const gitpodHost = getGitpodHost();
console.log('Gitpod workspace URL:', workspaceUrl);
console.log('Gitpod host:', gitpodHost);

export default defineConfig({
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    hmr: {
      port: 5173,
    },
    allowedHosts: gitpodHost ? [gitpodHost] : [],
  },
  build: {
    target: 'esnext',
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'Honeycomb',
    },
  },
  plugins: [dts({ tsconfigPath: 'tsconfig.json' })],
});
