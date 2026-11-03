import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  plugins: [viteSingleFile()],
  // polling: file events do not reach WSL from the Windows drive (/mnt/c), so the dev server would serve stale code
  server: { host: true, port: 5173, strictPort: true, watch: { usePolling: true, interval: 300 } },
  build: { outDir: 'dist', emptyOutDir: true },
});
