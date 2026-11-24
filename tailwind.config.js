/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Midnight Blue Luxury Theme Palette
        midnight: {
          DEFAULT: '#182536', // Midnight Blue
          main: '#182536',
          deep: '#263B50',    // Deep Blue
          card: '#223347',    // Card Background
          input: '#1D2C3D',   // Input Background
          border: '#3B4C5F',  // Borders
          darker: '#111A26',  // Deepest background
        },
        gold: {
          DEFAULT: '#C4A878', // Champagne Gold
          champagne: '#C4A878',
          hover: '#D2BC92',
          light: '#DFCFB0',
          dark: '#A68B5B',
          muted: '#C4A87833',
        },
        ivory: {
          DEFAULT: '#F5F1E8', // Warm Ivory
          warm: '#F5F1E8',
          muted: '#E5DFD3',
          secondary: '#AAB5C0', // Secondary Text
        },
        status: {
          success: '#5D9B79', // Success
          warning: '#D3A45D', // Warning
          error: '#C66B6B',   // Error
        },
        // Backwards compatibility mappings for existing component tokens
        brand: {
          50: '#F5F1E8',
          100: '#E5DFD3',
          200: '#DFCFB0',
          300: '#D2BC92',
          400: '#C4A878',
          500: '#C4A878',
          600: '#C4A878',
          700: '#A68B5B',
          800: '#263B50',
          900: '#182536',
          950: '#111A26',
        },
        navy: {
          50: '#F5F1E8',
          100: '#E5DFD3',
          200: '#AAB5C0',
          300: '#3B4C5F',
          400: '#263B50',
          500: '#223347',
          600: '#1D2C3D',
          700: '#182536',
          800: '#182536',
          900: '#111A26',
          950: '#0C131C',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        cinzel: ['Cinzel', 'serif'],
        script: ['"Great Vibes"', 'cursive'],
        montserrat: ['Montserrat', 'sans-serif'],
        devanagari: ['"Noto Sans Devanagari"', '"Mukta"', '"Hind"', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 2px 8px -2px rgba(17, 26, 38, 0.4)',
        'premium': '0 12px 30px -8px rgba(11, 18, 27, 0.6), 0 0 1px 1px rgba(196, 168, 120, 0.1)',
        'gold': '0 4px 16px -2px rgba(196, 168, 120, 0.25)',
      }
    },
  },
  plugins: [],
}
