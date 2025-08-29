/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      gridTemplateColumns: {
        16: 'repeat(16, minmax(0, 1fr))', // Adds support for 16 columns
      },
      boxShadow: {
        'equal': '0 0 15px rgba(0, 0, 0, 0.2)',
      }
    },
  },
  plugins: [],
}

