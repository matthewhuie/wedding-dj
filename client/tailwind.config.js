/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        champagne: {
          50: '#faf7f2',
          100: '#f5efe4',
          200: '#eddcc5',
          300: '#e3c59f',
          400: '#d7a874',
          500: '#c88c50',
          600: '#b87541',
          700: '#995a36',
          800: '#7d4931',
          900: '#673d2a',
        },
        roseGold: {
          50: '#fbf7f7',
          100: '#f8efee',
          200: '#f2dedc',
          300: '#e6c3c0',
          400: '#d59e9a',
          500: '#c07b77',
          600: '#a95f5c',
          700: '#8c4b49',
          800: '#75403e',
          900: '#633938',
        },
        spotify: {
          green: '#1DB954',
          dark: '#121212',
          card: '#181818',
          hover: '#282828'
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 12s linear infinite',
      }
    },
  },
  plugins: [],
}
