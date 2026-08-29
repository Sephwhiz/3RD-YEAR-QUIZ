/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Y2K Neo-Retro Palette
        midnight: '#1A0B2E',   // Deep background
        royal: '#240046',      // Window title bars / dark accents
        violet: '#3C096C',     // UI Containers / Cards
        indigo: '#10002B',     // Hard outlines / Borders
        neonCyan: '#00F5D4',   // Active states / Highlights
        glowYellow: '#FFD60A', // Sparkles / Warnings / Stars
        lavender: '#E0AAFF',   // Primary text color
      },
      fontFamily: {
        pixel: ['"Press Start 2P"', 'cursive'],
        mono: ['"Courier Prime"', 'monospace'],
      },
      boxShadow: {
        'hard': '4px 4px 0px #10002B',       // Standard hard shadow
        'hard-sm': '2px 2px 0px #10002B',    // Smaller elements
        'hard-lg': '8px 8px 0px #10002B',    // Large windows
        'inner-hard': 'inset 2px 2px 0px #10002B', // Pressed button effect
      },
      backgroundImage: {
        // Subtle grain/noise texture overlay
        'grain': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.15'/%3E%3C/svg%3E\")",
      }
    },
  },
  plugins: [],
}