import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

const hasLucide = fs.existsSync(path.resolve(__dirname, 'node_modules/lucide-react/package.json'))

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: hasLucide
      ? {}
      : {
          'lucide-react': path.resolve(__dirname, 'src/components/icons/lucide-shim.jsx'),
        },
  },
  server: {
    port: 5173,
  },
})
