/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#faf7ff",
          100: "#f2e8ff",
          200: "#e2ccff",
          300: "#c8a3ff",
          400: "#ad78f4",
          500: "#8f55dc",
          600: "#7a5c8e",
          700: "#643f83",
          800: "#4b2a63",
          900: "#2d1a3d",
        },
      },
      boxShadow: {
        soft: "0 12px 32px rgba(45, 26, 61, 0.16)",
      },
      fontFamily: {
        display: ["Cormorant Garamond", "serif"],
        ui: ["Inter", "sans-serif"],
        ar: ["El Messiri", "sans-serif"],
      },
    },
  },
  plugins: [],
};
