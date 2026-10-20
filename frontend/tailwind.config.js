/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#08213F',
          800: '#0C2D54',
          700: '#113A6B',
        },
        primary: {
          DEFAULT: '#1463E8',
          hover: '#0E44A3',
          light: '#EBF2FE',
        },
        teal: {
          accent: '#20C7C9',
          light: '#E6FAF9',
        },
        surface: {
          bg: '#F5F8FC',
          card: '#FFFFFF',
          border: '#E2E8F0',
          hover: '#F8FAFC',
        },
        risk: {
          low: '#10B981',
          lowBg: '#ECFDF5',
          lowBorder: '#A7F3D0',
          medium: '#F59E0B',
          mediumBg: '#FFFBEB',
          mediumBorder: '#FDE68A',
          high: '#EF4444',
          highBg: '#FEF2F2',
          highBorder: '#FECACA',
        },
        content: {
          primary: '#152238',
          secondary: '#718096',
          muted: '#A0AEC0',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(16, 24, 40, 0.06), 0 1px 2px 0 rgba(16, 24, 40, 0.04)',
        hover: '0 4px 6px -1px rgba(16, 24, 40, 0.08), 0 2px 4px -1px rgba(16, 24, 40, 0.04)',
      }
    },
  },
  plugins: [],
}
