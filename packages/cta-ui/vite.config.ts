import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import tailwind from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tsconfigPaths(), tailwind()],
  server: {
    open: true,
    port: 3000,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})
