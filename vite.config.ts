import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// BASE_PATH is set by the GitHub Pages workflow (/<repo>/). Locally it is '/'.
export default defineConfig({
  plugins: [react()],
  base: process.env.BASE_PATH ?? '/',
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 1200,
    rolldownOptions: {
      output: {
        advancedChunks: {
          groups: [
            { name: 'three', test: /node_modules[\\/](three|@react-three|postprocessing|maath|zustand|its-fine|suspend-react)/ },
            { name: 'motion', test: /node_modules[\\/](gsap|lenis)/ },
            { name: 'react', test: /node_modules[\\/](react|react-dom|react-router|scheduler)/ },
          ],
        },
      },
    },
  },
})
