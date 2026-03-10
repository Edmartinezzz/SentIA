"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // Avoid hydration mismatch
    useEffect(() => setMounted(true), []);

    if (!mounted) {
        return <div className="w-10 h-10 rounded-2xl bg-surface-variant flex items-center justify-center animate-pulse" />;
    }

    const toggleTheme = () => {
        if (theme === "system") setTheme("light");
        else if (theme === "light") setTheme("dark");
        else setTheme("system");
    };

    const icons = {
        light: <Sun className="w-5 h-5" />,
        dark: <Moon className="w-5 h-5" />,
        system: <Monitor className="w-5 h-5" />
    };

    return (
        <button
            onClick={toggleTheme}
            className="w-12 h-12 flex items-center justify-center rounded-2xl bg-surface-variant text-on-surface-variant hover:bg-primary-container hover:text-primary transition-colors relative overflow-hidden"
            title={`Tema actual: ${theme}`}
        >
            <AnimatePresence mode="wait" initial={false}>
                <motion.div
                    key={theme}
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 20, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    {icons[theme as keyof typeof icons] || icons.system}
                </motion.div>
            </AnimatePresence>
        </button>
    );
}
