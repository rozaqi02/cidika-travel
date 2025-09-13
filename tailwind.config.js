/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./public/index.html",
    "./src/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      container: { center: true, padding: "1rem" },
      boxShadow: {
        smooth: "0 10px 30px rgba(0,0,0,0.08)"
      }
    },
  },
  plugins: [],
}