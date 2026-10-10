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
        navy: {
          50: '#F0F4FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#232D4B',
          800: '#141B33',
          900: '#0E1428',
          950: '#0B1020', // Primary deep navy requested
        },
        electric: {
          50: '#EEF4FF',
          100: '#E0EBFF',
          200: '#C7D9FE',
          300: '#9DBEFE',
          400: '#6496FD',
          500: '#2F6BFF', // Primary electric blue requested
          600: '#1A4CE6',
          700: '#1539BA',
          800: '#163196',
          900: '#182C78',
        },
        violet: {
          500: '#8B5CF6', // Subtle violet requested
        },
        surface: {
          light: '#F5F7FA', // Primary light requested
          card: '#FFFFFF',
          darkCard: '#11172E',
          darkBorder: '#1E294B',
          hoverDark: '#17203E',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'glow': '0 0 25px -5px rgba(47, 107, 255, 0.25)',
        'glow-violet': '0 0 25px -5px rgba(139, 92, 246, 0.25)',
      }
    },
  },
  plugins: [],
}
