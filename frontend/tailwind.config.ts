import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0f131a",
        panel: "#18202b",
        tide: "#1f2c3b",
        coral: "#f56f5d",
        mint: "#6de0bf",
        sky: "#78b8ff"
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["'IBM Plex Sans'", "sans-serif"]
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(120,184,255,0.25), 0 20px 40px rgba(0,0,0,0.35)"
      }
    }
  },
  plugins: []
} satisfies Config;
