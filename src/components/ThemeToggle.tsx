"use client";

import { useTheme } from "./ThemeProvider";
import { Moon, Sun, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <button
      onClick={toggleTheme}
      className="fixed bottom-8 right-8 z-[100] flex items-center gap-3 px-6 py-3 bg-[var(--bg-primary)]/80 backdrop-blur-xl border border-[var(--border)] rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:scale-110 active:scale-95 transition-all group overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-silver/20 opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="relative flex items-center justify-center w-6 h-6">
        <AnimatePresence mode="wait">
          {theme === "dark" ? (
            <motion.div
              key="moon"
              initial={{ y: 20, opacity: 0, rotate: -90 }}
              animate={{ y: 0, opacity: 1, rotate: 0 }}
              exit={{ y: -20, opacity: 0, rotate: 90 }}
              transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            >
              <Moon className="w-5 h-5 text-amber-500" />
            </motion.div>
          ) : (
            <motion.div
              key="sun"
              initial={{ y: 20, opacity: 0, rotate: -90 }}
              animate={{ y: 0, opacity: 1, rotate: 0 }}
              exit={{ y: -20, opacity: 0, rotate: 90 }}
              transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            >
              <Sparkles className="w-5 h-5 text-zinc-600" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex flex-col items-start leading-none relative z-10 pr-1">
        <span className="text-[10px] font-black uppercase tracking-[0.1em] text-[var(--text-primary)]">
          {theme === "dark" ? "Onyx Mode" : "Silver Silk"}
        </span>
      </div>
      
      <div className="w-1.5 h-1.5 rounded-full bg-zinc-500 group-hover:bg-amber-500 transition-colors" />
    </button>
  );
}
