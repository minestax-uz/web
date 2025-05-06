/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,ts,jsx,tsx}", "./index.html"],
  theme: {
    extend: {
      colors: {
        background: "#1a1a1a",
        primary: "#facc15", // Amber-400
        secondary: "#d97706", // Amber-600
        accent: "#fcd34d", // Amber-300
        dark: {
          100: "#2d2b17",
          200: "#252314",
          300: "#1e1c11",
          400: "#17150e",
          500: "#100e0b",
        },
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};
