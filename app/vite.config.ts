import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    target: 'es2022',
    sourcemap: false,
  },
  server: {
    port: 4361,
    strictPort: true,
    /* ESPN and Polymarket reject requests from a localhost origin, so dev goes
       through the Vite proxy. Production calls the APIs directly. */
    proxy: {
      '/espn-api': {
        target: 'https://site.api.espn.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/espn-api/, ''),
        configure: (proxy: any) => {
          /* ESPN rejects a localhost Origin outright, so the proxy drops it. */
          proxy.on('proxyReq', (request: any) => {
            request.removeHeader('origin');
            request.removeHeader('referer');
          });
        },
      },
      /* The live Worker already normalises ESPN + DraftKings lines. */
      '/api': {
        target: 'https://multiview.cc',
        changeOrigin: true,
      },
      '/poly-api': {
        target: 'https://gamma-api.polymarket.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/poly-api/, ''),
        configure: (proxy: any) => {
          proxy.on('proxyReq', (request: any) => {
            request.removeHeader('origin');
          });
        },
      },
    },
  },
});
