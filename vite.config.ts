import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Относительные пути — работает на GitHub Pages по адресу https://<user>.github.io/<repo>/
  base: './',
  server: {
    port: 5173,
    // Диск S: не поддерживает нативное отслеживание файлов — используем опрос
    watch: { usePolling: true, interval: 300 },
  },
});
