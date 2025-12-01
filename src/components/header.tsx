"use client";
import { Badge } from "@/components/ui/badge";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

type ThemeMode = "light" | "dark";

export default function Header() {
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const mediaQuery = globalThis.matchMedia("(prefers-color-scheme: dark)");
    const storedTheme = localStorage.getItem("vulnxTheme") as ThemeMode | null;
    const initialTheme = storedTheme ?? (mediaQuery.matches ? "dark" : "light");
    setTheme(initialTheme);

    const handleChange = (event: MediaQueryListEvent) => {
      if (!localStorage.getItem("vulnxTheme")) {
        setTheme(event.matches ? "dark" : "light");
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    setMounted(true);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme, mounted]);

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      localStorage.setItem("vulnxTheme", next);
      return next;
    });
  };

  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
        <a href="/" className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-primary">
            Vulnx
          </h1>
          <Badge variant="secondary" className="text-xs">
            Web
          </Badge>
        </a>
        {mounted && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <button
              type="button"
              role="switch"
              aria-checked={theme === "dark"}
              onClick={toggleTheme}
              className="flex items-center gap-1 rounded-full border border-border bg-card/80 px-1 py-1 text-muted-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <span
                className={`flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium transition-colors ${
                  theme === "light"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground/70"
                }`}
              >
                <Sun className="h-3.5 w-3.5" />
                Light
              </span>
              <span
                className={`flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium transition-colors ${
                  theme === "dark"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground/70"
                }`}
              >
                <Moon className="h-3.5 w-3.5" />
                Dark
              </span>
              <span className="sr-only">Toggle color theme</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
