/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        accent: { DEFAULT: "#7C5CFC", secondary: "#9F7AFF", surface: "rgba(124,92,252,0.08)" },
        cyan:   { DEFAULT: "#06D6A0", surface: "rgba(6,214,160,0.08)" },
        danger: { DEFAULT: "#EF4444" },
      },
      fontFamily: {
        display: ["Inter", "system-ui", "sans-serif"],
        sans:    ["Inter", "system-ui", "sans-serif"],
        mono:    ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
