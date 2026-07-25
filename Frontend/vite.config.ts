import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
 
  resolve: {
    alias: {
      '@styles': path.resolve(__dirname, './src/styles'),
      '@components': path.resolve(__dirname, './src/components'),
      '@types': path.resolve(__dirname, './src/types'),
    },
  },

  server: {
    proxy: {
      // כל פנייה שתתחיל ב- /dnd-api תופנה ישירות ל-D&D Beyond
      '/dnd-api': {
        target: 'https://character-service.dndbeyond.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/dnd-api/, ''),
      },
    },
  },
});