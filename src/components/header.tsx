"use client";
import { Badge } from "@/components/ui/badge";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import Image from "next/image";

type ThemeMode = "light" | "dark";

export default function Header() {
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const mediaQuery = globalThis.matchMedia("(prefers-color-scheme: dark)");
    const storedTheme = localStorage.getItem("vulnlensTheme") as ThemeMode | null;
    const initialTheme = storedTheme ?? (mediaQuery.matches ? "dark" : "light");
    setTheme(initialTheme);

    const handleChange = (event: MediaQueryListEvent) => {
      if (!localStorage.getItem("vulnlensTheme")) {
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
      localStorage.setItem("vulnlensTheme", next);
      return next;
    });
  };

  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-5">
        <a href="/" className="flex items-center gap-3 group">
          <Image 
            src="/logo.png" 
            alt="VulnLens Logo" 
            width={32} 
            height={32}
            className="h-8 w-8"
          />
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            VulnLens
          </h1>
        </a>
        {mounted && (
          <button
            type="button"
            role="switch"
            aria-checked={theme === "dark"}
            onClick={toggleTheme}
            className="relative inline-flex h-8 w-14 items-center rounded-full border border-border bg-secondary transition-colors hover:bg-secondary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span
              className={`inline-flex h-6 w-6 items-center justify-center rounded-full bg-background shadow-sm transition-transform duration-200 ${
                theme === "dark" ? "translate-x-7" : "translate-x-1"
              }`}
            >
              {theme === "dark" ? (
                <Moon className="h-3.5 w-3.5 text-foreground" />
              ) : (
                <Sun className="h-3.5 w-3.5 text-foreground" />
              )}
            </span>
            <span className="sr-only">Toggle color theme</span>
          </button>
        )}
      </div>
    </header>
  );
}
