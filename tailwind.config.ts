import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        variable: "#2e86de",
        function: "#f1c40f",
        string: "#27ae60",
        comment: "#95a5a6",
        console: "#1a1a1a",
        editor: "#fefefe",
        inspector: "#f8f9fa",
      },
      fontFamily: {
        mono: ["JetBrains Mono", "Geist Mono", "monospace"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

export default config;
