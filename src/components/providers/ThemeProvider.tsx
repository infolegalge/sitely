"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Theme } from "@/types";

type ThemeContextValue = {
  theme: Theme;
  toggleTheme: () => void;
};

export const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  toggleTheme: () => {},
});

export default function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const stored = localStorage.getItem("sitely-theme") as Theme | null;
    if (stored === "light" || stored === "dark") {
      setTheme(stored);
      document.documentElement.setAttribute("data-theme", stored);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      localStorage.setItem("sitely-theme", next);
      document.documentElement.setAttribute("data-theme", next);
      return next;
    });
  }, []);

  return (
    <ThemeContext value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext>
  );
}
