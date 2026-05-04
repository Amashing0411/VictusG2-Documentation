/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // <--- THIS IS THE MAGIC WORD!
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        victus: {
          dark: '#0f172a',
          card: '#1e293b',
          accent: '#0ea5e9',
        }
      }
    },
  },
  plugins: [],
}