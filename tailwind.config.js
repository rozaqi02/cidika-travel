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
      colors: {
        brand: {
          DEFAULT: "#0ea5e9",
          deep: "#0284c7",
          warm: "#f59e0b",
          nature: "#10b981",
        },
      },
      boxShadow: {
        smooth: "0 10px 30px rgba(0,0,0,0.08)",
        "sky-glow": "0 16px 40px rgba(14,165,233,0.12)",
      },
    },
  },
  plugins: [],
}