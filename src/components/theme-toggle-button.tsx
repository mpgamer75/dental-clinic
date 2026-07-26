"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";

/**
 * Light/dark toggle.
 *
 * The accessible name is localised. It was hardcoded to "Toggle theme", which
 * is the wrong language on the site's own default locale — a Spanish-speaking
 * screen-reader user heard an English label on every page.
 *
 * The crossfade is CSS rather than four nested Framer Motion elements: the
 * previous implementation animated a spring rotation on two wrapper divs each
 * containing another animated div, which is a lot of machinery for swapping
 * two 17px glyphs, and it ignored `prefers-reduced-motion`. The global
 * reduced-motion rule neutralises the transitions below automatically.
 */
export function ThemeToggleButton() {
  const { theme, setTheme } = useTheme();
  const { lang } = useLanguage();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && theme === "dark";

  const label = mounted
    ? lang === "es"
      ? isDark
        ? "Cambiar a modo claro"
        : "Cambiar a modo oscuro"
      : isDark
        ? "Switch to light mode"
        : "Switch to dark mode"
    : lang === "es"
      ? "Cambiar el tema"
      : "Toggle theme";

  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={label}
      title={label}
      // Until mounted we cannot know the resolved theme, so the control is
      // rendered but inert rather than lying about the current state.
      disabled={!mounted}
    >
      <Sun
        aria-hidden="true"
        className={
          "absolute h-[1.15rem] w-[1.15rem] text-brass-ink transition-all duration-base ease-out-quart " +
          (isDark ? "scale-50 opacity-0" : "scale-100 opacity-100")
        }
      />
      <Moon
        aria-hidden="true"
        className={
          "absolute h-[1.15rem] w-[1.15rem] text-brass transition-all duration-base ease-out-quart " +
          (isDark ? "scale-100 opacity-100" : "scale-50 opacity-0")
        }
      />
    </Button>
  );
}
