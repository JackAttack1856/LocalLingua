import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        muted: "hsl(var(--muted))",
        border: "hsl(var(--border))",
        surface: "hsl(var(--surface))",
        surface2: "hsl(var(--surface-2))",
        primary: "hsl(var(--primary))",
        primaryForeground: "hsl(var(--primary-foreground))",
        ring: "hsl(var(--ring))",
        danger: "hsl(var(--danger))",
        success: "hsl(var(--success))",
      },
      boxShadow: {
        // “Light from above”: subtle top highlight + stronger shadow below.
        sky: "inset 0 1px 0 hsl(0 0% 100% / 0.55), 0 1px 2px hsl(var(--shadow) / 0.10), 0 12px 30px hsl(var(--shadow) / 0.18)",
        skyLift:
          "inset 0 1px 0 hsl(0 0% 100% / 0.45), 0 2px 6px hsl(var(--shadow) / 0.16), 0 20px 50px hsl(var(--shadow) / 0.28)",
      },
      transitionTimingFunction: {
        "out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
} satisfies Config;
