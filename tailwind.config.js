/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Google yeşil ana renk paleti
        primary: {
          50: '#e8f5e8',
          100: '#c8e6c8',
          200: '#a4d6a7',
          300: '#81c784',
          400: '#66bb6a',
          500: '#4caf50', // Ana Google yeşili
          600: '#43a047',
          700: '#388e3c',
          800: '#2e7d32',
          900: '#1b5e20',
        },
        // Google sarı yan renk paleti
        secondary: {
          50: '#fffef7',
          100: '#fffbeb',
          200: '#fef3c7',
          300: '#fde68a',
          400: '#fcd34d',
          500: '#fbbf24', // Ana Google sarısı
          600: '#f59e0b',
          700: '#d97706',
          800: '#b45309',
          900: '#92400e',
        },
        // Nötr renkler
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        }
      },
      fontFamily: {
        'sans': ['Inter', 'ui-sans-serif', 'system-ui'],
      },
      gridTemplateColumns: {
        // Golden Ratio grid columns
        'golden': '1.618fr 1fr',
        'golden-reverse': '1fr 1.618fr',
      },
    },
  },
  plugins: [],
} 