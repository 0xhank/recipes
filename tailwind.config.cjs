const defaultTheme = require("tailwindcss/defaultTheme");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      colors: {
        primary: "#E53E3E", // Vibrant Red
        "primary-dark": "#C53030", // Darker Red
        wash: "#FFF5F5", // Light Wash Red
        neutral: "#A0AEC0", // Cool Gray
      },
      fontFamily: {
        sans: ["Lato", ...defaultTheme.fontFamily.sans],
        serif: ["Playfair Display", ...defaultTheme.fontFamily.serif],
      },
    },
  },
  plugins: [],
};
