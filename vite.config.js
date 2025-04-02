import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  // Optional: configure server options if needed
  server: {
    port: 3000, // Example port
    open: true    // Automatically open in browser
  },
  // Optional: configure build options if needed
  build: {
    outDir: 'dist'
  },
  // Ensure assets from public directory are copied
  publicDir: 'public'
});
