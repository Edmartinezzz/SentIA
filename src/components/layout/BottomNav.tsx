"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { navItems } from "@/lib/nav-items";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function BottomNav() {
    const pathname = usePathname();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Limit items for bottom nav (4 main + 1 more button)
    const mainNavItems = navItems.slice(0, 4); // Chat, Wellness, Journal, Sounds
    const extraNavItems = navItems.slice(4); // Resources, Progress, Badges, Profile, Settings

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-[100]">
            <AnimatePresence>
                {isMenuOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMenuOpen(false)}
                            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[-1]"
                        />

                        {/* Menu Drawer */}
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", stiffness: 400, damping: 40 }}
                            className="absolute bottom-full left-0 right-0 bg-surface-container-high rounded-t-3xl border-t border-outline/10 shadow-[0_-20px_40px_rgba(0,0,0,0.1)] p-4 pb-6 z-[-1]"
                        >
                            <div className="w-12 h-1.5 bg-outline/20 rounded-full mx-auto mb-6" />

                            <div className="grid grid-cols-4 gap-4 px-2">
                                {extraNavItems.map((item) => {
                                    const isActive = pathname === item.href;
                                    const Icon = item.icon;

                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={() => setIsMenuOpen(false)}
                                            className="flex flex-col items-center gap-2 group"
                                        >
                                            <div className={`flex items-center justify-center w-14 h-14 rounded-2xl transition-all ${isActive ? "bg-primary text-on-primary shadow-md" : "bg-surface-container text-on-surface-variant group-hover:bg-surface-variant"}`}>
                                                <Icon className="w-6 h-6" />
                                            </div>
                                            <span className={`text-[11px] font-medium text-center leading-tight ${isActive ? "text-primary font-bold" : "text-on-surface-variant"}`}>
                                                {item.name}
                                            </span>
                                        </Link>
                                    );
                                })}
                                <div className="flex flex-col items-center gap-2">
                                    <div className="flex items-center justify-center w-14 h-14">
                                        <ThemeToggle />
                                    </div>
                                    <span className="text-[11px] font-medium text-center leading-tight text-on-surface-variant">
                                        Tema
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Background blur with gradient border top */}
            <div className="absolute inset-0 bg-background/90 backdrop-blur-xl border-t border-outline/10 shadow-[0_-8px_30px_rgba(0,0,0,0.05)]" />

            <nav className="relative flex justify-around items-center px-2 pb-safe pt-2">
                {mainNavItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setIsMenuOpen(false)}
                            className="relative flex flex-col items-center justify-center w-16 h-14 group"
                        >
                            <AnimatePresence>
                                {isActive && !isMenuOpen && (
                                    <motion.div
                                        layoutId="bottom-nav-active"
                                        className="absolute top-0 w-12 h-1 bg-gradient-to-r from-primary to-[#008B8B] rounded-b-full shadow-[0_2px_10px_rgba(0,139,139,0.5)]"
                                        initial={false}
                                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                    />
                                )}
                            </AnimatePresence>

                            <div className={`mt-1 flex items-center justify-center rounded-2xl p-2 transition-all duration-300 ${isActive && !isMenuOpen ? "bg-primary/10 shadow-inner" : "bg-transparent group-hover:bg-on-surface/5"}`}>
                                <Icon
                                    className={`w-6 h-6 transition-all duration-300 ${isActive && !isMenuOpen ? "text-primary scale-110 drop-shadow-md" : "text-on-surface-variant/70 group-hover:text-on-surface scale-100"}`}
                                    strokeWidth={isActive && !isMenuOpen ? 2.5 : 2}
                                />
                            </div>

                            <span className={`text-[10px] font-medium leading-none mt-1 transition-all duration-300 ${isActive && !isMenuOpen ? "text-primary font-bold opacity-100 transform translate-y-0" : "text-on-surface-variant/70 opacity-0 group-hover:opacity-100 transform translate-y-1"}`}>
                                {item.name}
                            </span>
                        </Link>
                    );
                })}

                {/* More Button */}
                <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="relative flex flex-col items-center justify-center w-16 h-14 group"
                >
                    <AnimatePresence>
                        {isMenuOpen && (
                            <motion.div
                                layoutId="bottom-nav-active"
                                className="absolute top-0 w-12 h-1 bg-gradient-to-r from-primary to-[#008B8B] rounded-b-full shadow-[0_2px_10px_rgba(0,139,139,0.5)]"
                                initial={false}
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            />
                        )}
                    </AnimatePresence>

                    <div className={`mt-1 flex items-center justify-center rounded-2xl p-2 transition-all duration-300 ${isMenuOpen ? "bg-primary/10 shadow-inner" : "bg-transparent group-hover:bg-on-surface/5"}`}>
                        {isMenuOpen ? (
                            <X className="w-6 h-6 text-primary scale-110 drop-shadow-md transition-all duration-300" strokeWidth={2.5} />
                        ) : (
                            <Menu className="w-6 h-6 text-on-surface-variant/70 group-hover:text-on-surface transition-all duration-300" strokeWidth={2} />
                        )}
                    </div>

                    <span className={`text-[10px] font-medium leading-none mt-1 transition-all duration-300 ${isMenuOpen ? "text-primary font-bold opacity-100 transform translate-y-0" : "text-on-surface-variant/70 opacity-0 group-hover:opacity-100 transform translate-y-1"}`}>
                        Más
                    </span>
                </button>
            </nav>
            {/* Environment safe area padding */}
            <div className="h-safe w-full bg-transparent" style={{ paddingBottom: 'env(safe-area-inset-bottom, 16px)' }} />
        </div>
    );
}
