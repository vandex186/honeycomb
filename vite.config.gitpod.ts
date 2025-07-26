import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Gitpod-specific configuration
const isGitpod = !!process.env.GITPOD_WORKSPACE_URL;
const gitpodHost = process.env.GITPOD_WORKSPACE_URL;

console.log('🔧 Gitpod Environment Detection:');
console.log(`   - Is Gitpod: ${isGitpod}`);
console.log(`   - Workspace URL: ${gitpodHost}`);
console.log(`   - Workspace Context: ${process.env.GITPOD_WORKSPACE_CONTEXT_URL}`);

export default defineConfig({
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    hmr: {
      port: 5173,
    },
    allowedHosts: isGitpod && gitpodHost ? [gitpodHost] : 'all',
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