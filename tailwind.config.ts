import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: { ink: "#2d2920", brand: "#426a52", moss: "#28513a", lotus: "#c97886", cream: "#fbf7ef", sand: "#e9ddc8" },
      boxShadow: { card: "0 14px 38px rgba(68, 53, 35, 0.10)" },
    },
  },
  plugins: [],
} satisfies Config;
