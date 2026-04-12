import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { compression } from 'vite-plugin-compression2';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    compression({
      algorithm: 'gzip',
      threshold: 1024,
    }),
    compression({
      algorithm: 'brotliCompress',
      threshold: 1024,
    }),
    process.env.ANALYZE && visualizer({
      open: true,
      filename: 'bundle-analysis.html',
      gzipSize: true,
    }),
  ].filter(Boolean),
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    target: 'es2020',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/') || id.includes('node_modules/react-router')) {
            return 'react-vendor';
          }
          if (id.includes('node_modules/i18next') || id.includes('node_modules/react-i18next')) {
            return 'i18n';
          }
          if (id.includes('node_modules/react-helmet-async')) {
            return 'ui-utils';
          }
        },
      },
    },
    sourcemap: false,
    chunkSizeWarningLimit: 500,
  },
});
