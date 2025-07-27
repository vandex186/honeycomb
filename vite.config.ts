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

// Determine if we're in a Gitpod environment
const isGitpod = !!process.env.GITPOD_WORKSPACE_URL;
const isDevelopment = process.env.NODE_ENV === 'development';

// Solution for "Blocked request" error in Gitpod:
// - In Gitpod or development mode: allow all hosts (true)
// - In production: use specific allowed hosts for security

export default defineConfig({
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    hmr: {
      port: 5173,
    },
    allowedHosts: isGitpod || isDevelopment ? true : [
      // Allow the specific Gitpod host if available
      ...(gitpodHost ? [gitpodHost] : []),
      // Allow any Gitpod workspace URL pattern
      '*.gitpod.io',
      // Allow localhost for local development
      'localhost',
      '127.0.0.1',
    ],
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
