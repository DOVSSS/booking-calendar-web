/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#1a1a1a',
          charcoal: '#2c2c2c',
          slate: '#3d3d3d',
          silver: '#c8c8c8',
          muted: '#8f8f8f',
        },
      },
    },
  },
  plugins: [],
}