/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./templates/**/*.html",
    "./apps/**/templates/**/*.html",
  ],
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        adminBrand: {
          50: "#f8f3ff",
          100: "#efe6ff",
          200: "#dcc6ff",
          300: "#c39bff",
          400: "#a873ef",
          500: "#8f55dc",
          600: "#7a5c8e",
          700: "#643f83",
          800: "#4b2a63",
          900: "#2d1a3d",
        },
      },
      fontFamily: {
        display: ["Cormorant Garamond", "serif"],
        ui: ["Inter", "sans-serif"],
        ar: ["El Messiri", "sans-serif"],
      },
      boxShadow: {
        admin: "0 18px 40px rgba(45, 26, 61, 0.16)",
      },
    },
  },
  plugins: [],
};
