import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: process.env.VITE_BASE_PATH || '/Legacy-Coffee/',
  server: { host: '127.0.0.1', port: 5173, strictPort: true, open: true },
})
