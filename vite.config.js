import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: process.env.NODE_ENV === 'production' ? '/rcahub/' : '/',
  publicDir: 'public',
  server: {
    fs: {
      // Allow serving files from the project root
      allow: ['..']
    }
  }
})



