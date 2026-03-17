import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    tailwindcss(),
  ],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        library: resolve(__dirname, 'library.html'),
        book: resolve(__dirname, 'book.html'),
        location: resolve(__dirname, 'location.html'),
        login: resolve(__dirname, 'login.html')
      }
    }
  }
});
