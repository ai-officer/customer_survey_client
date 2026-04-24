import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.APP_URL': JSON.stringify(env.APP_URL),
    },
    server: {
      port: 3000,
      hmr: process.env.DISABLE_HMR !== 'true',
      proxy: {
        '/api': {
          target: FASTAPI_URL,
          changeOrigin: true,
          // preserve content-type and body as-is (critical for form-encoded login)
          configure: (proxy) => {
            proxy.on('error', (err) => {
              console.error('[proxy error]', err.message);
            });
          },
        },
      },
    },
  };
});
