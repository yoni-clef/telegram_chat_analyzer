import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#111111",
        haze: "#f5f2ed",
        accent: "#ff7a59",
        ocean: "#0b3d91"
      }
    }
  },
  plugins: []
} satisfies Config;
