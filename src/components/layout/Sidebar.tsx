"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Sparkles, LogOut } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { navItems } from "@/lib/nav-items";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/");
    };
    return (
        <div className="flex w-72 flex-col ml-4 my-4 p-6 bg-surface-container rounded-3xl shadow-sm border border-outline/10 hidden md:flex transition-all duration-500 overflow-hidden relative group/sidebar z-20">
            <div className="mb-10 flex items-center justify-between px-2 relative z-10">
                <Link href="/" className="flex items-center gap-3 transition-all duration-300 hover:scale-105 active:scale-95">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-[#008B8B] text-on-primary shadow-lg shadow-primary/20">
                        <Sparkles className="h-6 w-6" />
                    </div>
                    <span className="text-2xl font-black tracking-tighter bg-gradient-to-r from-primary to-[#008B8B] bg-clip-text text-transparent">
                        SentIA
                    </span>
                </Link>
                <ThemeToggle />
            </div>

            <nav className="flex flex-1 flex-col gap-1.5">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`group relative flex items-center gap-4 rounded-full px-5 py-3.5 text-sm font-bold transition-all duration-300 ${isActive
                                ? "text-on-primary-container"
                                : "text-on-surface-variant/70 hover:text-on-surface hover:bg-primary/5"
                                }`}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="sidebar-active"
                                    className="absolute inset-0 rounded-full bg-gradient-to-r from-primary-container to-secondary-container shadow-sm border border-primary/10"
                                    initial={false}
                                    transition={{
                                        type: "spring",
                                        stiffness: 400,
                                        damping: 35,
                                    }}
                                />
                            )}

                            <Icon className={`relative z-10 h-5 w-5 transition-colors duration-300 ${isActive ? 'text-primary' : 'text-on-surface-variant group-hover:text-primary'}`} />
                            <span className="relative z-10 tracking-tight">{item.name}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="mt-auto flex flex-col gap-6 px-2">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 rounded-2xl px-5 py-3 text-sm font-bold text-red-500 hover:bg-red-500/10 transition-all group"
                >
                    <LogOut className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
                    <span>Cerrar sesión</span>
                </button>

                <div className="rounded-[24px] bg-gradient-to-br from-primary/10 to-secondary/10 p-5 text-center border border-primary/10 backdrop-blur-sm">
                    <p className="text-xs font-bold text-primary leading-relaxed">
                        Tu bienestar mental es<br />nuestra prioridad hoy.
                    </p>
                </div>
            </div>
        </div>
    );
}

