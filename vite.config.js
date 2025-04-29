import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { configDotenv } from 'dotenv'
import path from 'path'

configDotenv();

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
})
