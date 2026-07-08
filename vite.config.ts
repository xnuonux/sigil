import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// sigil is local-first + sovereign. no proxies, no env-injected endpoints, nothing leaves the machine.
export default defineConfig({
  plugins: [react()],
  build: { target: 'es2020' },
});
