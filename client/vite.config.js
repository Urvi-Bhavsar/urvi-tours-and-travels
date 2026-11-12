import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // Local development: requests to /api are forwarded to the backend on port 4000.
    // (Production on Vercel uses VITE_API_URL instead, so this has no effect there.)
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        configure: (proxy) => {
          // Backend not running / crashed: answer with a clear message instead of a bare 500
          proxy.on('error', (err, _req, res) => {
            console.error('\n[proxy] Cannot reach the backend on http://localhost:4000 (' + err.code + ').');
            console.error('[proxy] Start it in the server folder with: npm run start\n');
            if (res && !res.headersSent && typeof res.writeHead === 'function') {
              res.writeHead(503, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Backend is not running on port 4000. Start it with "npm run start" in the server folder.' }));
            }
          });
        },
      },
    },
  },
});
