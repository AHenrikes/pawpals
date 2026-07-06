import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";
import scrollbarHide from "tailwind-scrollbar-hide";

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
          dim: "hsl(var(--primary-dim))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: "hsl(var(--destructive))",
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
        outline: "hsl(var(--outline))", 
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",

        headline: "hsl(var(--headline))",
        text: {
          DEFAULT: "hsl(var(--text))",
          foreground: "hsl(var(--text-foreground))",
          primary: "hsl(var(--text-primary))",
          secondary: "hsl(var(--text-secondary))",
          destructive: "hsl(var(--text-destructive))",
          muted: "hsl(var(--text-muted))",
        },
      },
      borderRadius: {
        sm: "calc(var(--radius) - 8px)",
        md: "calc(var(--radius) - 4px)",
        base: "var(--radius)",
        lg: "calc(var(--radius) + 4px)",
        xl: "calc(var(--radius) - 8px)",
        full: "9999px",
      },
      backgroundImage: {
        "pawpals-primary": "var(--gradient-primary)",
      },
      boxShadow: {
        ambient: "var(--ambient-shadow)",
      },
      letterSpacing: {
        display: "-0.02em",
      },
      backdropBlur: {
        blur: "hsl(var(--blur))",
      },
    },
  },
  plugins: [tailwindcssAnimate, scrollbarHide],
} satisfies Config;
