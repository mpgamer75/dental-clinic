import type { Config } from "tailwindcss";

/**
 * Warm Consulta.
 *
 * Colours resolve to `oklch(var(--token) / <alpha-value>)`, so every opacity
 * utility (`bg-primary/10`, `border-line/60`, …) keeps working while the
 * underlying ramp stays perceptually even across the warm hue band.
 *
 * The custom properties themselves live in src/app/globals.css and hold bare
 * `L C H` triples — not full colour functions — which is what makes the
 * `<alpha-value>` substitution legal here.
 */
const ok = (name: string) => `oklch(var(--${name}) / <alpha-value>)`;

export default {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        /* ---- semantic (shadcn/ui contract) ---- */
        background: ok("background"),
        foreground: ok("foreground"),
        card: { DEFAULT: ok("card"), foreground: ok("card-foreground") },
        popover: { DEFAULT: ok("popover"), foreground: ok("popover-foreground") },
        primary: { DEFAULT: ok("primary"), foreground: ok("primary-foreground") },
        secondary: { DEFAULT: ok("secondary"), foreground: ok("secondary-foreground") },
        muted: { DEFAULT: ok("muted"), foreground: ok("muted-foreground") },
        accent: { DEFAULT: ok("accent"), foreground: ok("accent-foreground") },
        highlight: { DEFAULT: ok("highlight"), foreground: ok("highlight-foreground") },
        destructive: { DEFAULT: ok("destructive"), foreground: ok("destructive-foreground") },
        success: { DEFAULT: ok("success"), foreground: ok("success-foreground") },
        warning: { DEFAULT: ok("warning"), foreground: ok("warning-foreground") },
        border: ok("border"),
        input: ok("input"),
        ring: ok("ring"),

        /* ---- brand palette (use these for new work) ---- */
        canvas: { DEFAULT: ok("canvas"), sunk: ok("canvas-sunk") },
        surface: { DEFAULT: ok("surface"), raised: ok("surface-raised") },
        ink: { DEFAULT: ok("ink"), soft: ok("ink-soft"), faint: ok("ink-faint") },
        terracotta: {
          DEFAULT: ok("primary-base"),
          hover: ok("primary-hover"),
          soft: ok("primary-soft"),
          border: ok("primary-border"),
        },
        drench: { DEFAULT: ok("drench"), deep: ok("drench-deep"), on: ok("on-drench") },
        petrol: { DEFAULT: ok("petrol"), soft: ok("petrol-soft") },
        brass: { DEFAULT: ok("brass"), ink: ok("brass-ink"), soft: ok("brass-soft"), on: ok("on-brass") },
        line: { DEFAULT: ok("line"), strong: ok("line-strong") },

        chart: {
          "1": ok("chart-1"),
          "2": ok("chart-2"),
          "3": ok("chart-3"),
          "4": ok("chart-4"),
          "5": ok("chart-5"),
        },
        sidebar: {
          DEFAULT: ok("sidebar-background"),
          foreground: ok("sidebar-foreground"),
          primary: ok("sidebar-primary"),
          "primary-foreground": ok("sidebar-primary-foreground"),
          accent: ok("sidebar-accent"),
          "accent-foreground": ok("sidebar-accent-foreground"),
          border: ok("sidebar-border"),
          ring: ok("sidebar-ring"),
        },
      },

      fontFamily: {
        sans: ["var(--font-body)", "ui-sans-serif", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "ui-sans-serif", "system-ui", "sans-serif"],
        heading: ["var(--font-heading)", "ui-serif", "Georgia", "serif"],
      },

      borderRadius: {
        sm: "calc(var(--radius) - 3px)",
        md: "calc(var(--radius) - 1px)",
        lg: "var(--radius)",
        xl: "var(--radius-lg)",
        "2xl": "var(--radius-xl)",
      },

      boxShadow: {
        e1: "var(--e1)",
        e2: "var(--e2)",
        e3: "var(--e3)",
        e4: "var(--e4)",
        e5: "var(--e5)",
      },

      transitionTimingFunction: {
        "out-quart": "var(--ease-out-quart)",
        "out-quint": "var(--ease-out-quint)",
        "out-expo": "var(--ease-out-expo)",
        "in-out-quart": "var(--ease-in-out-quart)",
      },

      transitionDuration: {
        fast: "var(--dur-fast)",
        base: "var(--dur-base)",
        slow: "var(--dur-slow)",
        slower: "var(--dur-slower)",
      },

      zIndex: {
        raised: "10",
        sticky: "20",
        header: "30",
        overlay: "40",
        modal: "50",
        toast: "60",
        tooltip: "70",
      },

      /* Fluid section rhythm. Varies deliberately — not one uniform gap. */
      spacing: {
        section: "clamp(4rem, 9vw, 8.5rem)",
        "section-tight": "clamp(2.75rem, 6vw, 5.5rem)",
      },

      maxWidth: {
        measure: "68ch",
        "measure-tight": "52ch",
      },

      keyframes: {
        "accordion-down": {
          from: { height: "0", opacity: "0" },
          to: { height: "var(--radix-accordion-content-height)", opacity: "1" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)", opacity: "1" },
          to: { height: "0", opacity: "0" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translate3d(0,14px,0)" },
          to: { opacity: "1", transform: "translate3d(0,0,0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        /* Ambient drift for the hero light-wash. Long and low-amplitude so it
           reads as light moving through a room, not as an animation. */
        drift: {
          "0%, 100%": { transform: "translate3d(0,0,0) scale(1)" },
          "50%": { transform: "translate3d(2%, -3%, 0) scale(1.06)" },
        },
      },

      animation: {
        "accordion-down": "accordion-down var(--dur-base) var(--ease-out-quart)",
        "accordion-up": "accordion-up var(--dur-fast) var(--ease-out-quart)",
        "fade-up": "fade-up var(--dur-slow) var(--ease-out-quint) both",
        "fade-in": "fade-in var(--dur-base) var(--ease-out-quart) both",
        drift: "drift 26s var(--ease-in-out-quart) infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
