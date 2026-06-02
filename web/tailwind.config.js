/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      colors: {
        // Gloom + Grant — cool, foggy slate/indigo
        gloom: {
          400: "#8aa0bb",
          500: "#5f7794",
          600: "#475a73",
        },
        // Big Dogs — sun gold/amber
        dogs: {
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
        },
      },
      keyframes: {
        pulseglow: {
          "0%,100%": { opacity: "0.55" },
          "50%": { opacity: "1" },
        },
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
      animation: {
        pulseglow: "pulseglow 2.4s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
