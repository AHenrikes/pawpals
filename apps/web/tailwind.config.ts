import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./providers/**/*.{js,ts,jsx,tsx,mdx}",
    "./utils/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./hooks/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        surface: {
          DEFAULT: "hsl(var(--surface))",
          low: "hsl(var(--surface-container-low))",
          highest: "hsl(var(--surface-container-highest))",
          variant: "hsl(var(--surface-variant))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          dim: "hsl(var(--primary-dim))"
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",

        headline:  "hsl(var(--headline))",
        text: {
          DEFAULT: "hsl(var(--text))",
          primary: "hsl(var(--text-primary))",
          secondary: "hsl(var(--text-secondary))",
          destructive: "hsl(var(--text-destructive))",
          muted: "hsl(var(--text-muted))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "2rem",
        "2xl": "3rem",
        full: "9999px",
      },
      backgroundImage: {
        "pawpal-primary": "var(--gradient-primary)",
        "fur-gradient": `
          linear-gradient(
            0deg,
            transparent,
            hsl(0 0% 0%) 26%,
            hsl(0 0% 0%) 33%,
            hsl(0 0% 0%) 39%,
            hsl(0 0% 0%) 44%,
            hsl(0 0% 0%) 50%,
            hsl(0 0% 0%) 56%,
            hsl(0 0% 0%) 61%,
            hsl(0 0% 0%) 67%,
            hsl(0 0% 0%) 74%,
            transparent
          )`
        ,
      },
      boxShadow: {
        ambient: "var(--ambient-shadow)",
      },
      letterSpacing: {
        display: "-0.02em",
      },
      backdropBlur: {
        glass: "24px",
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
