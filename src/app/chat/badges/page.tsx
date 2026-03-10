"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Award, Zap, Wind, HeartPulse, Star, Calendar, ArrowLeft, Trophy } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

type UserBadge = {
    id: string;
    badge_type: string;
    badge_name: string;
    reflective_message: string;
    earned_at: string;
};

const BADGE_CONFIG: Record<string, { icon: any, color: string, bg: string }> = {
    resilience: { icon: Zap, color: "text-amber-500", bg: "bg-amber-100 dark:bg-amber-900/30" },
    calm: { icon: Wind, color: "text-blue-500", bg: "bg-blue-100 dark:bg-blue-900/30" },
    self_care: { icon: HeartPulse, color: "text-rose-500", bg: "bg-rose-100 dark:bg-rose-900/30" },
    clarity: { icon: Star, color: "text-violet-500", bg: "bg-violet-100 dark:bg-violet-900/30" },
    discipline: { icon: Award, color: "text-emerald-500", bg: "bg-emerald-100 dark:bg-emerald-900/30" },
};

export default function BadgesPage() {
    const [badges, setBadges] = useState<UserBadge[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBadges = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                setLoading(false);
                return;
            }

            const { data, error } = await supabase
                .from("user_badges")
                .select("*")
                .eq("user_id", session.user.id)
                .order("earned_at", { ascending: false });

            if (!error && data) {
                setBadges(data);
            }
            setLoading(false);
        };

        fetchBadges();
    }, []);

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { y: 20, opacity: 0 },
        show: { y: 0, opacity: 1 }
    };

    return (
        <div className="flex h-full flex-col gap-6 bg-background px-4 py-8 text-on-surface md:px-8 overflow-y-auto scrollbar-hide">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link
                        href="/chat/progress"
                        className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-container text-primary shadow-sm hover:brightness-95 transition-all"
                    >
                        <ArrowLeft className="h-6 w-6" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-on-surface">Tu Galería de Logros</h1>
                        <p className="text-[16px] text-on-surface-variant font-medium">Celebra cada paso en tu camino hacia el bienestar.</p>
                    </div>
                </div>

                <div className="hidden sm:flex items-center gap-3 rounded-2xl bg-secondary-container px-5 py-2.5 shadow-sm text-on-secondary-container">
                    <Trophy className="h-5 w-5 text-amber-500" />
                    <span className="font-bold text-lg">{badges.length}</span>
                    <span className="text-sm font-medium opacity-80">Insignias</span>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-1 items-center justify-center">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                </div>
            ) : badges.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center text-center py-20">
                    <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-[32px] bg-surface-container p-6 text-on-surface-variant/30">
                        <Award className="h-10 w-10" />
                    </div>
                    <h2 className="text-2xl font-bold text-on-surface mb-2">Aún no tienes insignias</h2>
                    <p className="max-w-xs text-on-surface-variant font-medium mb-8">
                        Completa tus actividades diarias al 100% y pulsa "Finalizar Día" para ganar tu primera insignia.
                    </p>
                    <Link
                        href="/chat/progress"
                        className="rounded-full bg-primary px-10 py-4 font-bold text-on-primary shadow-lg hover:brightness-105 transition-all"
                    >
                        Ir a Progreso
                    </Link>
                </div>
            ) : (
                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 pb-8"
                >
                    {badges.map((badge) => {
                        const config = BADGE_CONFIG[badge.badge_type] || { icon: Award, color: "text-on-surface-variant", bg: "bg-surface-container-high" };
                        const Icon = config.icon;

                        return (
                            <motion.div
                                key={badge.id}
                                variants={item}
                                className="group relative flex flex-col overflow-hidden rounded-[32px] bg-surface-container p-6 shadow-sm transition-all hover:scale-[1.02] border border-outline/5"
                            >
                                <div className="mb-6 flex items-center justify-between">
                                    <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${config.bg} ${config.color} transition-transform group-hover:rotate-6`}>
                                        <Icon className="h-8 w-8" />
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-on-surface-variant opacity-60">
                                        <Calendar className="h-3.5 w-3.5" />
                                        {new Date(badge.earned_at).toLocaleDateString()}
                                    </div>
                                </div>

                                <h3 className="mb-3 text-xl font-bold text-on-surface group-hover:text-primary transition-colors">
                                    {badge.badge_name}
                                </h3>

                                <div className="mt-auto rounded-2xl bg-surface-container-high p-4 border border-outline/5">
                                    <p className="text-[13px] italic font-medium leading-relaxed text-on-surface-variant">
                                        "{badge.reflective_message}"
                                    </p>
                                </div>
                            </motion.div>
                        );
                    })}
                </motion.div>
            )}

            {/* Footer Quote */}
            <div className="mt-auto pt-6 pb-10">
                <div className="rounded-[32px] bg-primary-container p-8 text-on-primary-container shadow-sm relative overflow-hidden">
                    <div className="relative z-10">
                        <h4 className="text-2xl font-bold mb-3">Tu camino es único</h4>
                        <p className="max-w-2xl text-[16px] font-medium leading-relaxed italic opacity-90">
                            "Cada insignia representa un momento en el que elegiste priorizar tu salud mental. No es solo un logro visual, es un recordatorio de tu fortaleza y compromiso contigo mismo."
                        </p>
                    </div>
                    <Star className="absolute -bottom-8 -right-8 h-40 w-40 text-primary/10 rotate-12" />
                </div>
            </div>
        </div>
    );
}
