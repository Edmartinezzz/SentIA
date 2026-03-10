"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, CheckCircle2, Circle, Rocket, Droplets, Wind, Pencil, Brain, Flame, FlameKindling } from "lucide-react";
import confetti from "canvas-confetti";
import { supabase } from "@/lib/supabase";

type Mission = {
    id?: string;
    title: string;
    category: "nutrition" | "mindfulness" | "reflection" | "relax" | "activity";
    is_completed: boolean;
};

type StreakData = {
    current_streak: number;
    best_streak: number;
    last_streak_date: string | null;
};

const MISSION_POOL: Omit<Mission, "id" | "is_completed">[] = [
    { title: "Beber un vaso de agua al despertar", category: "nutrition" },
    { title: "Realizar una sesión de respiración de 2 min", category: "mindfulness" },
    { title: "Escribir una nota en el diario sobre lo que sientes", category: "reflection" },
    { title: "Escuchar sonidos de lluvia por 5 min", category: "relax" },
    { title: "Realizar estiramientos ligeros por 3 min", category: "activity" },
    { title: "Comer una fruta o algo saludable", category: "nutrition" },
    { title: "Identificar una cosa por la que estés agradecido", category: "reflection" },
    { title: "Hacer una pausa de 5 min sin pantallas", category: "relax" },
    { title: "Caminar un poco dentro de casa o oficina", category: "activity" },
    { title: "Respirar profundo 5 veces conscientemente", category: "mindfulness" }
];

const CATEGORY_ICONS: Record<string, any> = {
    nutrition: Droplets,
    mindfulness: Wind,
    reflection: Pencil,
    relax: Brain,
    activity: Flame
};

type Props = {
    userId: string | null;
};

export default function DailyMissions({ userId }: Props) {
    const [missions, setMissions] = useState<Mission[]>([]);
    const [streak, setStreak] = useState<StreakData>({ current_streak: 0, best_streak: 0, last_streak_date: null });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (userId) {
            loadMissions();
            loadStreak();
        } else {
            setLoading(false);
        }
    }, [userId]);

    const loadStreak = async () => {
        if (!userId) return;
        const { data, error } = await supabase
            .from("user_streaks")
            .select("*")
            .eq("user_id", userId)
            .single();

        if (!error && data) {
            setStreak(data as StreakData);
        }
    };

    const loadMissions = async () => {
        try {
            const today = new Date().toISOString().split('T')[0];

            // Cargar misiones de hoy
            const { data, error } = await supabase
                .from("daily_missions")
                .select("*")
                .eq("user_id", userId)
                .gte("created_at", today);

            if (!error && data && data.length > 0) {
                setMissions(data as Mission[]);
            } else {
                // Si no hay misiones hoy o hay error, generar 3 aleatorias
                const shuffled = [...MISSION_POOL].sort(() => 0.5 - Math.random());
                const selected = shuffled.slice(0, 3).map(m => ({
                    ...m,
                    user_id: userId,
                    is_completed: false
                }));

                const { data: inserted, error: insError } = await supabase
                    .from("daily_missions")
                    .insert(selected)
                    .select();

                if (!insError && inserted && inserted.length > 0) {
                    setMissions(inserted as Mission[]);
                } else {
                    // Fallback local si falla DB o no hay insert
                    // Añadimos IDs temporales para poder clickar
                    setMissions(selected.map((m, i) => ({ ...m, id: `local-${i}` })) as Mission[]);
                }
            }
        } catch (err) {
            console.error("Error loading missions:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleMission = async (id: string, currentStatus: boolean) => {
        // Optimistic update
        setMissions(prev => prev.map(m => m.id === id ? { ...m, is_completed: !currentStatus } : m));

        if (!currentStatus) {
            // Lanzar confeti!
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#006A6A', '#00A19D', '#FFB4AB']
            });
        }

        // Si es una ID local, no intentamos guardar en DB
        if (id.startsWith('local-')) return;

        try {
            const { error } = await supabase
                .from("daily_missions")
                .update({ is_completed: !currentStatus })
                .eq("id", id);

            if (!error && !currentStatus) {
                // Verificar si con este cambio se completan todas
                const updatedMissions = missions.map(m => m.id === id ? { ...m, is_completed: true } : m);
                if (updatedMissions.every(m => m.is_completed)) {
                    updateStreak();
                }
            }
        } catch (e) {
            console.error("Silence DB error during toggle:", e);
        }
    };

    const updateStreak = async () => {
        if (!userId) return;
        const today = new Date().toISOString().split('T')[0];

        // Si ya se actualizó hoy, no hacer nada
        if (streak.last_streak_date === today) return;

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        let newCurrent = 1;
        if (streak.last_streak_date === yesterdayStr) {
            newCurrent = streak.current_streak + 1;
        }

        const newBest = Math.max(streak.best_streak, newCurrent);

        const { data, error } = await supabase
            .from("user_streaks")
            .upsert({
                user_id: userId,
                current_streak: newCurrent,
                best_streak: newBest,
                last_streak_date: today,
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (!error && data) {
            setStreak(data as StreakData);
            // Confeti extra por racha!
            confetti({
                particleCount: 200,
                spread: 100,
                origin: { y: 0.5 },
                colors: ['#FF4D4D', '#FFB347', '#FFCC33']
            });
        }
    };

    if (loading) return (
        <div className="h-48 w-full animate-pulse bg-surface-container rounded-[32px] border border-outline/5" />
    );

    const completedCount = missions.filter(m => m.is_completed).length;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="liquid-glass rounded-[40px] p-8 md:p-10 shadow-2xl border border-outline/10 space-y-8 relative overflow-hidden"
        >
            {/* Header */}
            <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-5">
                    <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-secondary/20 text-secondary shadow-lg shadow-secondary/10 font-bold">
                        <Rocket className="h-8 w-8" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-on-surface tracking-tight">Misiones Diarias</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                            <p className="text-sm font-black text-primary uppercase tracking-widest">
                                {completedCount === 3 ? "¡Misiones completadas!" : `${completedCount}/3 misiones listas`}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-end">
                    <div className="flex items-center gap-2 mb-1">
                        <motion.div
                            animate={streak.current_streak > 0 ? { scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] } : {}}
                            transition={{ repeat: Infinity, duration: 2 }}
                        >
                            <Flame className={`h-6 w-6 ${streak.current_streak > 0 ? 'text-orange-500 fill-orange-500/20' : 'text-outline opacity-30'}`} />
                        </motion.div>
                        <span className="text-xl font-black text-on-surface">{streak.current_streak}</span>
                    </div>
                    <span className="text-[10px] font-black uppercase text-outline tracking-wider mb-2">Racha • Récord: {streak.best_streak}</span>
                    <div className="flex gap-1.5">
                        {[1, 2, 3].map(i => (
                            <div
                                key={i}
                                className={`h-2.5 w-8 rounded-full transition-all duration-500 ${i <= completedCount ? 'bg-primary shadow-lg shadow-primary/20' : 'bg-surface-variant/30'}`}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Missions List */}
            <div className="grid gap-4 relative z-10">
                {missions.map((mission, idx) => {
                    const Icon = CATEGORY_ICONS[mission.category] || Rocket;
                    return (
                        <motion.button
                            key={mission.id || idx}
                            whileHover={{ scale: 1.02, x: 5 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleToggleMission(mission.id!, mission.is_completed)}
                            className={`flex items-center gap-5 p-6 rounded-[32px] border transition-all duration-300 text-left
                                ${mission.is_completed
                                    ? 'bg-primary/10 border-primary/30 opacity-70'
                                    : 'bg-surface-container-low/60 border-outline/5 hover:bg-surface-container shadow-sm hover:shadow-md'}
                            `}
                        >
                            <div className={`p-4 rounded-2xl ${mission.is_completed ? 'bg-primary text-on-primary' : 'bg-surface-variant/30 text-on-surface-variant'}`}>
                                <Icon className="h-6 w-6" />
                            </div>

                            <div className="flex-1">
                                <h3 className={`font-bold text-lg leading-tight tracking-tight ${mission.is_completed ? 'line-through opacity-50' : 'text-on-surface'}`}>
                                    {mission.title}
                                </h3>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-outline mt-1.5 opacity-60">
                                    {mission.category}
                                </p>
                            </div>

                            <div className={`shrink-0 ${mission.is_completed ? 'text-primary' : 'text-outline opacity-20'}`}>
                                {mission.is_completed ? <CheckCircle2 className="h-8 w-8" /> : <Circle className="h-8 w-8" />}
                            </div>
                        </motion.button>
                    );
                })}
            </div>

            {!userId && (
                <div className="absolute inset-0 z-20 bg-surface-container/10 backdrop-blur-[2px] flex items-center justify-center p-10 text-center">
                    <div className="bg-surface-container p-8 rounded-[40px] shadow-2xl border border-outline/10">
                        <p className="font-black uppercase tracking-widest text-on-surface-variant text-sm">Inicia sesión para jugar</p>
                    </div>
                </div>
            )}
        </motion.div>
    );
}

