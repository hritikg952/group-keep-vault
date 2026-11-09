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
        keep: {
          default: 'transparent',
          coral: '#faafa8',
          peach: '#f39f76',
          sand: '#fff8b8',
          mint: '#e2f6d3',
          sage: '#b4ddd3',
          fog: '#d4e4ed',
          storm: '#aeccdc',
          dusk: '#d3bfdb',
          blossom: '#f6e2dd',
          clay: '#e9e3d4',
          chalk: '#efeff1',
        },
        keepDark: {
          default: '#202124',
          coral: '#77172e',
          peach: '#692b17',
          sand: '#7c4a03',
          mint: '#264d3b',
          sage: '#0c625d',
          fog: '#256377',
          storm: '#284255',
          dusk: '#472e5b',
          blossom: '#6c394f',
          clay: '#4b443a',
          chalk: '#232427',
        }
      },
      fontFamily: {
        sans: ['"Google Sans"', 'Roboto', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'keep': '0 1px 2px 0 rgba(60,64,67,0.3), 0 2px 6px 2px rgba(60,64,67,0.15)',
        'keep-hover': '0 1px 3px 0 rgba(60,64,67,0.3), 0 4px 8px 3px rgba(60,64,67,0.15)',
      }
    },
  },
  plugins: [],
}
