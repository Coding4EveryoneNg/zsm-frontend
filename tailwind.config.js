/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          orange: '#ff6b35',
          'orange-dark': '#e55a2b',
          'orange-light': '#ff8c5a',
        },
      },
    },
  },
  plugins: [],
}

