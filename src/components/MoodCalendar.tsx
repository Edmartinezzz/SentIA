"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, TrendingUp, Plus, X } from "lucide-react";
import { supabase } from "@/lib/supabase";

type EmotionLog = {
    created_at: string;
    mood: string;
    intensity: number;
};

type Props = {
    emotionLogs: EmotionLog[];
    userId?: string | null;
    onLogAdded?: () => void;
};

const MOOD_CONFIG: Record<string, { color: string; label: string; emoji: string; intensity: number }> = {
    joy: { color: "bg-amber-400", label: "Alegría", emoji: "😊", intensity: 8 },
    calm: { color: "bg-emerald-400", label: "Calma", emoji: "😌", intensity: 4 },
    sadness: { color: "bg-blue-400", label: "Tristeza", emoji: "😢", intensity: 5 },
    anxiety: { color: "bg-violet-400", label: "Ansiedad", emoji: "😰", intensity: 7 },
    anger: { color: "bg-rose-400", label: "Enojo", emoji: "😠", intensity: 7 },
    neutral: { color: "bg-slate-300", label: "Neutral", emoji: "😐", intensity: 3 },
};

const WEEKDAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export default function MoodCalendar({ emotionLogs: initialLogs, userId, onLogAdded }: Props) {
    const [logs, setLogs] = useState<EmotionLog[]>(initialLogs);
    const [selectedDay, setSelectedDay] = useState<{ date: Date; key: string } | null>(null);
    const [saving, setSaving] = useState(false);

    // Sincronizar logs cuando cambian las props
    useEffect(() => {
        setLogs(initialLogs);
    }, [initialLogs]);

    // Mapa de emociones por día
    const moodByDate: Record<string, { mood: string; intensity: number }> = {};
    logs.forEach(log => {
        const dateKey = new Date(log.created_at).toDateString();
        if (!moodByDate[dateKey] || log.intensity > moodByDate[dateKey].intensity) {
            moodByDate[dateKey] = { mood: log.mood, intensity: log.intensity };
        }
    });

    // Últimos 30 días
    const days: { date: Date; key: string }[] = [];
    for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        d.setHours(0, 0, 0, 0);
        days.push({ date: d, key: d.toDateString() });
    }

    const loggedDays = Object.keys(moodByDate).length;
    const moodCounts: Record<string, number> = {};
    logs.forEach(log => { moodCounts[log.mood] = (moodCounts[log.mood] || 0) + 1; });
    const dominantMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0];

    const handleSelectMood = async (mood: string) => {
        if (!selectedDay) return;
        setSaving(true);
        console.log("Saving mood:", mood, "for user:", userId);

        const config = MOOD_CONFIG[mood];
        const timestamp = new Date(selectedDay.date);
        timestamp.setHours(12, 0, 0, 0);

        const newLog = {
            created_at: timestamp.toISOString(),
            mood,
            intensity: config.intensity
        };

        try {
            // Guardar en Supabase si hay sesión
            if (userId) {
                const { error } = await supabase.from("emotion_logs").insert({
                    user_id: userId,
                    mood,
                    intensity: config.intensity,
                    conversation_id: null,
                    created_at: timestamp.toISOString()
                });

                if (error) {
                    console.error("Supabase error (mood save):", error);
                    throw error;
                }
            } else {
                // Modo invitado: usar localStorage
                const stored = localStorage.getItem("SentIA_guest_moods");
                const guestMoods = stored ? JSON.parse(stored) : [];
                localStorage.setItem("SentIA_guest_moods", JSON.stringify([...guestMoods, newLog]));
            }

            // Actualizar estado local inmediatamente
            setLogs(prev => [...prev, newLog]);
            onLogAdded?.();
        } catch (err) {
            console.error("Error saving mood:", err);
            alert("No se pudo guardar el ánimo. Por favor, intenta de nuevo.");
        } finally {
            setSaving(false);
            setSelectedDay(null);
        }
    };

    return (
        <div className="bg-surface-container rounded-[32px] p-8 shadow-sm border border-outline/5 space-y-6 relative">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-container text-primary shadow-sm">
                        <CalendarDays className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-on-surface">Calendario de Ánimo</h2>
                        <p className="text-sm text-on-surface-variant font-medium">
                            Toca un día para registrar cómo te sentiste
                        </p>
                    </div>
                </div>

                {dominantMood && (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-secondary-container text-secondary border border-outline/10">
                        <TrendingUp className="h-4 w-4" />
                        <span className="text-sm font-bold">
                            {MOOD_CONFIG[dominantMood[0]]?.emoji} {MOOD_CONFIG[dominantMood[0]]?.label}
                        </span>
                    </div>
                )}
            </div>

            {/* Días de la semana */}
            <div className="grid grid-cols-7 gap-1">
                {WEEKDAYS.map(d => (
                    <div key={d} className="text-center text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">{d}</div>
                ))}
            </div>

            {/* Grilla de días */}
            <div className="grid grid-cols-7 gap-2">
                {Array(days[0].date.getDay()).fill(null).map((_, i) => (
                    <div key={`empty-${i}`} />
                ))}

                {days.map((day, i) => {
                    const entry = moodByDate[day.key];
                    const config = entry ? MOOD_CONFIG[entry.mood] : null;
                    const isToday = day.key === new Date().toDateString();
                    const isSelected = selectedDay?.key === day.key;

                    return (
                        <motion.button
                            key={day.key}
                            type="button"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.005 }}
                            whileHover={{ scale: 1.15, zIndex: 10 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setSelectedDay(isSelected ? null : day)}
                            title={
                                entry
                                    ? `${day.date.toLocaleDateString("es", { day: "numeric", month: "short" })}: ${MOOD_CONFIG[entry.mood]?.label}`
                                    : `Registrar ánimo: ${day.date.toLocaleDateString("es", { day: "numeric", month: "short" })}`
                            }
                            className={`
                relative aspect-square rounded-[14px] flex items-center justify-center transition-all cursor-pointer border border-transparent
                ${config ? `${config.color} shadow-sm text-white` : "bg-surface-variant/30 hover:bg-primary-container/40 dark:bg-white/5"}
                ${isToday ? "ring-2 ring-primary ring-offset-2 ring-offset-surface-container" : ""}
                ${isSelected ? "ring-2 ring-primary scale-110" : ""}
              `}
                        >
                            {config ? (
                                <span className="text-base select-none drop-shadow-sm">{config.emoji}</span>
                            ) : isToday ? (
                                <Plus className="h-4 w-4 text-primary" />
                            ) : (
                                <Plus className="h-3 w-3 text-on-surface-variant/20 opacity-0 group-hover:opacity-100" />
                            )}
                        </motion.button>
                    );
                })}
            </div>

            {/* Emoji Selector - ahora con estilo MD3 Tonal Card */}
            <AnimatePresence>
                {selectedDay && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="bg-surface-container-high rounded-[32px] p-6 border border-outline/10 shadow-lg space-y-4"
                    >
                        <div className="flex items-center justify-between">
                            <p className="font-bold text-base text-on-surface">
                                ¿Cómo te sentiste el{" "}
                                <span className="text-primary">
                                    {selectedDay.date.toLocaleDateString("es", { day: "numeric", month: "long" })}
                                </span>
                                {selectedDay.key === new Date().toDateString() ? " (hoy)" : ""}?
                            </p>
                            <motion.button
                                type="button"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => setSelectedDay(null)}
                                className="h-10 w-10 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-variant/50 transition-all"
                            >
                                <X className="h-5 w-5" />
                            </motion.button>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            {Object.entries(MOOD_CONFIG).map(([key, val]) => (
                                <motion.button
                                    key={key}
                                    type="button"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleSelectMood(key)}
                                    disabled={saving}
                                    className={`flex flex-col items-center gap-2 rounded-2xl p-4 transition-all border border-transparent
                    ${val.color.replace("bg-", "hover:bg-").replace("-400", "-400/10")}
                    hover:border-outline/20
                    disabled:opacity-50 disabled:cursor-wait`}
                                >
                                    <span className="text-3xl">{val.emoji}</span>
                                    <span className="text-xs font-bold text-on-surface-variant">{val.label}</span>
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Leyenda + Stats */}
            <div className="flex flex-wrap gap-4 pt-4 border-t border-outline/10">
                {Object.entries(MOOD_CONFIG).map(([key, val]) => (
                    <div key={key} className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${val.color}`} />
                        <span className="text-[11px] font-bold text-on-surface-variant tracking-tight">{val.label}</span>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="bg-surface-container-low rounded-2xl p-4 border border-outline/5 text-center">
                    <p className="text-3xl font-bold text-primary">{loggedDays}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mt-1">Días registrados</p>
                </div>
                <div className="bg-surface-container-low rounded-2xl p-4 border border-outline/5 text-center">
                    <p className="text-3xl font-bold text-secondary">{logs.length}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mt-1">Registros totales</p>
                </div>
            </div>
        </div>
    );
}

