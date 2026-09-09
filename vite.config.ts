import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // Add this to allow your specific tunnel domain:
    allowedHosts: ['potter-expenses-drain-bumper.trycloudflare.com'],
  }
});
