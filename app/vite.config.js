import { defineConfig } from 'vite'

// Bound to 0.0.0.0 so the sandbox preview proxy can reach the dev server,
// and permissive host/origin handling so the live-preview domain works.
export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    allowedHosts: true,
    cors: true,
  },
  preview: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
  },
})
