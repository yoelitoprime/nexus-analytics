/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Todos los colores van aquí
      colors: {
        mc: {
          green: '#55AA33',
          stone: '#313233',
        }
      },
      // Todas las fuentes van aquí, dentro del mismo extend
      fontFamily: {
        minecraft: ['Kanit', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

