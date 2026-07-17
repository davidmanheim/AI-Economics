import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Relative base: every emitted asset/link is resolved relative to
  // index.html's own location, so the build works unmodified no matter what
  // sub-path (or domain) it's deployed under — no per-deployment config needed.
  base: './',
  plugins: [react()],
})
