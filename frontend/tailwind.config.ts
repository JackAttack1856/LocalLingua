import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "hsl(0 0% 100%)",
        foreground: "hsl(222.2 84% 4.9%)",
        muted: "hsl(210 40% 96.1%)",
        border: "hsl(214.3 31.8% 91.4%)",
        primary: "hsl(222.2 47.4% 11.2%)",
        primaryForeground: "hsl(210 40% 98%)",
      },
      boxShadow: {
        soft: "0 12px 32px rgba(0,0,0,0.10)",
      },
    },
  },
  plugins: [],
} satisfies Config;

