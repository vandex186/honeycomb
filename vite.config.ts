import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

const __dirname = dirname(fileURLToPath(import.meta.url));

const workspaceUrl = process.env.GITPOD_WORKSPACE_URL || '';
const allowedHost = workspaceUrl.replace(/https?:\/\//, '');

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
console.log('Resolved allowedHost:', allowedHost);
console.log('Gitpod host:', gitpodHost);

export default defineConfig({
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    hmr: {
      port: 5173,
    },
    allowedHosts: [
      allowedHost,
      gitpodHost,
      // Allow any Gitpod workspace URL pattern
      '*.gitpod.io',
      '*.ws-us120.gitpod.io',
      '*.ws-us121.gitpod.io',
      '*.ws-us122.gitpod.io',
      '*.ws-us123.gitpod.io',
      '*.ws-us124.gitpod.io',
      '*.ws-us125.gitpod.io',
      '*.ws-us126.gitpod.io',
      '*.ws-us127.gitpod.io',
      '*.ws-us128.gitpod.io',
      '*.ws-us129.gitpod.io',
      '*.ws-us130.gitpod.io',
    ].filter(Boolean),
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
