import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  plugins: [viteSingleFile()],
  server: { host: true, port: 5173, strictPort: true },
  build: { outDir: 'dist', emptyOutDir: true },
});
