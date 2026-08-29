import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'hero.png', 'icons.svg', 'pwa-192x192.png', 'pwa-512x512.png'],
      manifest: {
        name: 'BSIT 3N Quiz Reviewer',
        short_name: 'QuizReviewer',
        description: 'Offline quiz reviewer for BSIT 3N students',
        theme_color: '#10002B',
        background_color: '#10002B',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,woff,woff2}']
      }
    })
  ],
})