"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "silver";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const savedTheme = localStorage.getItem("signal-arena-theme") as Theme;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    if (theme === "silver") {
      document.documentElement.classList.add("theme-silver");
    } else {
      document.documentElement.classList.remove("theme-silver");
    }
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "silver" : "dark";
    setTheme(newTheme);
    localStorage.setItem("signal-arena-theme", newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
