import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      external: [
        '@capacitor-community/admob',
        '@capacitor-community/in-app-purchases',
      ],
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three/')) return 'three'
          if (id.includes('@react-three/fiber') || id.includes('@react-three/drei') || id.includes('@react-three/rapier')) return 'r3f'
        },
      },
    },
  },
})
