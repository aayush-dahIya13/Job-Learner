import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: { ink: "var(--jl-text)", brand: "var(--jl-primary-hover)", moss: "var(--jl-primary)", lotus: "var(--jl-accent)", cream: "var(--jl-canvas)", sand: "var(--jl-canvas-soft)" },
      boxShadow: { card: "var(--jl-shadow)" },
    },
  },
  plugins: [],
} satisfies Config;
