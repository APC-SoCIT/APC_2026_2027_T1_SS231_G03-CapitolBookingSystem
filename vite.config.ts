import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // Leading dot allows any cloudflared quick-tunnel subdomain.
    allowedHosts: ['.trycloudflare.com'],
  }
});
