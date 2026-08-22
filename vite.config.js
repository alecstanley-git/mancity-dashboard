import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Custom domain (mancity.alecstanley.com) serves from the root, so no `base`.
export default defineConfig({
  plugins: [react()],
  build: { outDir: 'dist', sourcemap: true },
});
