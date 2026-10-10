/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        academic: {
          bg: '#F7F5EF',           // Primary background (warm ivory)
          card: '#FFFFFF',         // Main card background (white)
          primary: '#245B45',      // Primary brand colour (forest green)
          'primary-hover': '#1B4736',
          secondary: '#DCE8DC',    // Secondary colour (soft sage)
          text: '#252923',         // Main text (charcoal)
          muted: '#747970',        // Secondary text
          border: '#E5E0D5',       // Border colour
          accent: '#C59B52',       // Highlight accent (muted gold)
          hover: '#EAF0E8',        // Hover background
          surface: '#FDFCF9',
        },
        forest: {
          50: '#F0F6F2',
          100: '#DCE8DC',
          200: '#B8D3B9',
          300: '#8FB992',
          400: '#5F9966',
          500: '#245B45', // Primary forest green
          600: '#1D4937',
          700: '#173A2C',
          800: '#112C21',
          900: '#0B1D16',
        },
        sage: {
          50: '#F8FAF8',
          100: '#EAF0E8', // Hover background
          200: '#DCE8DC', // Secondary colour
          300: '#C2D6C3',
          400: '#A4BFA5',
          500: '#7F9E80',
        },
        gold: {
          100: '#F9F4EB',
          200: '#EFE3CE',
          300: '#E0CB9E',
          400: '#D4AF6B',
          500: '#C59B52', // Muted gold highlight accent
          600: '#AA823E',
        },
        charcoal: {
          50: '#F6F6F5',
          100: '#E7E8E6',
          200: '#CFD0CD',
          400: '#747970', // Secondary text
          700: '#3E433B',
          900: '#252923', // Main text
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(37, 41, 35, 0.04), 0 1px 2px -1px rgba(37, 41, 35, 0.03)',
        'card': '0 2px 6px -1px rgba(37, 41, 35, 0.05), 0 1px 4px -1px rgba(37, 41, 35, 0.03)',
        'hover': '0 8px 20px -4px rgba(36, 91, 69, 0.12), 0 3px 8px -2px rgba(37, 41, 35, 0.04)',
        'elevated': '0 12px 28px -6px rgba(37, 41, 35, 0.1), 0 4px 12px -2px rgba(37, 41, 35, 0.04)',
      }
    },
  },
  plugins: [],
}
