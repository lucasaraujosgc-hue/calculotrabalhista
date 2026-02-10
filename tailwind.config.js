/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./index.tsx",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'virgula-card': '#0f172a', // Equivalente ao slate-900 usado anteriormente
        'virgula-green': '#10b981', // Equivalente ao emerald-500 usado anteriormente
      }
    },
  },
  plugins: [],
}