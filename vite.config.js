import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // This configuration is essential for styled-components to work correctly with Vite.
      // It uses the Babel plugin to properly handle the CSS-in-JS syntax,
      // ensuring your styles are correctly injected into the application.
      babel: {
        plugins: [['styled-components', { displayName: true }]]
      }
    })
  ],
  server: {
    // The `open: true` option automatically opens the browser when the dev server starts.
    open: true,
    // Setting the `host` to '127.0.0.1' explicitly tells the Vite server to listen on
    // the local machine's loopback address. This ensures that the server is
    // only accessible from your machine and can help resolve certain network issues
    // or firewall problems.
    host: '127.0.0.1' 
  },
});