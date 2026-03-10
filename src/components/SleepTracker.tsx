"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Moon, Star, Frown, Meh, Smile, BatteryFull, CalendarDays, ChevronLeft, ChevronRight, Zap, CalendarDays as ClockDays, Save, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase";

type SleepQuality = "poor" | "fair" | "good" | "excellent";

type SleepLog = {
    id: string;
    date: string; // YYYY-MM-DD
    hours: number;
    quality: SleepQuality;
};

const QUALITY_CONFIG: Record<SleepQuality, { label: string; icon: any; color: string; bg: string }> = {
    poor: { label: "Pobre", icon: Frown, color: "text-rose-500", bg: "bg-rose-500/10 border-rose-500/20 hover:bg-rose-500/20" },
    fair: { label: "Regular", icon: Meh, color: "text-amber-500", bg: "bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/20" },
    good: { label: "Bueno", icon: Smile, color: "text-emerald-500", bg: "bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20" },
    excellent: { label: "Excelente", icon: BatteryFull, color: "text-indigo-500", bg: "bg-indigo-500/10 border-indigo-500/20 hover:bg-indigo-500/20" }
};

type Props = {
    userId: string | null;
};

export default function SleepTracker({ userId }: Props) {
    const [logs, setLogs] = useState<SleepLog[]>([]);
    const [loading, setLoading] = useState(true);

    // Input states para hoy
    const [hours, setHours] = useState(7.5);
    const [quality, setQuality] = useState<SleepQuality | null>(null);
    const [saving, setSaving] = useState(false);
    const [todayLogged, setTodayLogged] = useState(false);

    // Estadísticas
    const [avgHours, setAvgHours] = useState(0);

    useEffect(() => {
        if (userId) loadSleepData();
        else setLoading(false);
    }, [userId]);

    const loadSleepData = async () => {
        // Últimos 7 días
        const d = new Date();
        d.setDate(d.getDate() - 7);
        const dateStr = d.toISOString().split('T')[0];

        const { data } = await supabase
            .from("sleep_logs")
            .select("*")
            .eq("user_id", userId)
            .gte("date", dateStr)
            .order("date", { ascending: true });

        if (data) {
            setLogs(data as SleepLog[]);

            // Check if today is logged
            const todayStr = new Date().toISOString().split('T')[0];
            const todayLog = data.find(l => l.date === todayStr);
            if (todayLog) {
                setTodayLogged(true);
                setHours(todayLog.hours);
                setQuality(todayLog.quality);
            }

            // Calculate AVG
            if (data.length > 0) {
                const total = data.reduce((acc, curr) => acc + Number(curr.hours), 0);
                setAvgHours(total / data.length);
            }
        }
        setLoading(false);
    };

    const handleSaveSlepp = async () => {
        if (!userId || !quality) return;
        setSaving(true);

        const todayStr = new Date().toISOString().split('T')[0];

        const { data, error } = await supabase
            .from("sleep_logs")
            .upsert({
                user_id: userId,
                date: todayStr,
                hours: hours,
                quality: quality
            }, { onConflict: 'user_id, date' })
            .select()
            .maybeSingle();

        if (!error && data) {
            setTodayLogged(true);
            // Actualizar listado localmente
            const filteredOrig = logs.filter(l => l.date !== todayStr);
            const newLogs = [...filteredOrig, data as SleepLog].sort((a, b) => a.date.localeCompare(b.date));
            setLogs(newLogs);

            const total = newLogs.reduce((acc, curr) => acc + Number(curr.hours), 0);
            setAvgHours(total / newLogs.length);
        }

        setSaving(false);
    };

    // Preparar datos gráfico últimos 7 días
    const last7Days: { date: Date; key: string, log?: SleepLog }[] = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        last7Days.push({
            date: d,
            key,
            log: logs.find(l => l.date === key)
        });
    }

    if (loading) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="liquid-glass rounded-[40px] p-8 md:p-10 shadow-2xl border border-outline/10 space-y-10 relative overflow-hidden"
        >
            {/* HEADER */}
            <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-5">
                    <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/20 text-primary shadow-lg shadow-primary/10 font-bold">
                        <Moon className="h-8 w-8" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-on-surface tracking-tight">Registro de Sueño</h2>
                        <p className="text-sm text-on-surface-variant font-bold opacity-60 uppercase tracking-widest mt-1">
                            {todayLogged ? "Registro Completado" : "¿Cómo descansaste?"}
                        </p>
                    </div>
                </div>

                {avgHours > 0 && (
                    <div className="flex items-center gap-3 px-6 py-4 rounded-3xl bg-surface-container-highest/50 backdrop-blur-md text-on-surface border border-outline/10">
                        <Star className="h-5 w-5 text-secondary" />
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase text-outline tracking-wider">Media Semanal</span>
                            <span className="text-lg font-black tracking-tight">{avgHours.toFixed(1)}h</span>
                        </div>
                    </div>
                )}
            </div>

            {/* ZONA DE INPUT */}
            {userId ? (
                <div className="bg-surface-container-low/40 rounded-[36px] p-8 border border-outline/5 space-y-10 relative overflow-hidden backdrop-blur-sm shadow-inner mt-4">
                    {todayLogged && (
                        <div className="absolute top-0 right-0 p-6">
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="bg-primary text-on-primary text-[10px] font-black px-4 py-1.5 rounded-full shadow-lg shadow-primary/20 uppercase tracking-widest"
                            >
                                Sincronizado
                            </motion.div>
                        </div>
                    )}

                    {/* SLIDER DE HORAS */}
                    <div className="space-y-8">
                        <div className="flex items-baseline justify-between">
                            <div className="flex items-center gap-3">
                                <ClockDays className="h-4 w-4 text-primary opacity-60" />
                                <h3 className="text-xs font-black text-on-surface-variant uppercase tracking-[0.2em]">Tiempo de Sueño</h3>
                            </div>
                            <div className="text-5xl font-black text-primary tracking-tighter">
                                {hours} <span className="text-2xl text-on-surface-variant/30 font-bold ml-1">h</span>
                            </div>
                        </div>

                        <div className="relative pt-4 pb-2">
                            <input
                                type="range"
                                min="0" max="14" step="0.5"
                                value={hours}
                                onChange={(e) => {
                                    setHours(parseFloat(e.target.value));
                                    setTodayLogged(false);
                                }}
                                className="w-full h-3 bg-surface-variant/30 rounded-full appearance-none cursor-pointer accent-primary"
                            />
                            <div className="flex justify-between text-[10px] text-on-surface-variant/30 font-black mt-4 px-1 uppercase tracking-[0.3em]">
                                <span>Mínimo</span>
                                <span>Ideal (8h)</span>
                                <span>Máximo</span>
                            </div>
                        </div>
                    </div>

                    {/* CALIDAD */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <Zap className="h-4 w-4 text-secondary opacity-60" />
                            <h3 className="text-xs font-black text-on-surface-variant uppercase tracking-[0.2em]">Calidad Percibida</h3>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {(Object.keys(QUALITY_CONFIG) as SleepQuality[]).map((q) => {
                                const config = QUALITY_CONFIG[q];
                                const Icon = config.icon;
                                const isSelected = quality === q;

                                return (
                                    <motion.button
                                        key={q}
                                        type="button"
                                        whileHover={{ y: -4, scale: 1.02 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => {
                                            setQuality(q);
                                            setTodayLogged(false);
                                        }}
                                        className={`flex flex-col items-center gap-3 p-6 rounded-3xl border transition-all duration-300
                      ${isSelected ? 'bg-primary/10 text-primary border-primary/40 shadow-xl shadow-primary/5' : 'bg-surface-variant/20 border-transparent text-on-surface-variant/40 hover:bg-surface-variant/40 hover:text-on-surface-variant'}
                    `}
                                    >
                                        <div className={`p-3 rounded-2xl ${isSelected ? 'bg-primary text-on-primary' : 'bg-surface-variant/20'}`}>
                                            <Icon className="h-6 w-6" />
                                        </div>
                                        <span className="text-sm font-black tracking-tight">{config.label}</span>
                                    </motion.button>
                                );
                            })}
                        </div>
                    </div>

                    {/* BOTÓN REGISTRAR */}
                    <AnimatePresence>
                        {!todayLogged && quality && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="pt-4"
                            >
                                <motion.button
                                    whileHover={{ scale: 1.02, boxShadow: "0 10px 40px -10px rgba(0, 106, 106, 0.4)" }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleSaveSlepp}
                                    disabled={saving}
                                    className="w-full flex items-center justify-center gap-3 py-6 rounded-full bg-primary text-on-primary font-black text-lg shadow-2xl transition-all disabled:opacity-50"
                                >
                                    {saving ? (
                                        <><RefreshCw className="w-6 h-6 animate-spin" /> Sincronizando...</>
                                    ) : (
                                        <><Save className="w-6 h-6" /> Actualizar Registro</>
                                    )}
                                </motion.button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            ) : (
                <div className="text-center py-20 opacity-40">
                    <div className="h-24 w-24 mx-auto mb-6 bg-surface-container-highest rounded-full flex items-center justify-center text-on-surface-variant/20">
                        <Moon className="h-12 w-12" />
                    </div>
                    <p className="text-sm font-black uppercase tracking-[0.2em]">Inicia sesión para sincronizar</p>
                </div>
            )}

            {/* EVOLUCIÓN */}
            {logs.length > 0 && (
                <div className="pt-8 relative z-10">
                    <div className="flex items-center gap-3 mb-10">
                        <CalendarDays className="h-4 w-4 text-secondary opacity-60" />
                        <h3 className="text-xs font-black text-on-surface-variant uppercase tracking-[0.2em]">Patrón de Descanso Semanal</h3>
                    </div>

                    <div className="flex items-end justify-between h-44 gap-4 px-2">
                        {last7Days.map((day) => {
                            const heightPct = day.log ? Math.min(100, (day.log.hours / 12) * 100) : 10;
                            const config = day.log ? QUALITY_CONFIG[day.log.quality] : null;

                            return (
                                <div key={day.key} className="flex flex-col items-center gap-5 flex-1 group relative">
                                    <div className="w-full max-w-[48px] h-full flex items-end justify-center relative">
                                        {day.log && (
                                            <div className="absolute -top-14 bg-on-surface text-surface text-[10px] font-black px-4 py-2 rounded-full opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-300 shadow-2xl z-20 whitespace-nowrap uppercase tracking-widest">
                                                {day.log.hours}h • {config?.label}
                                            </div>
                                        )}

                                        <div className="w-full bg-surface-variant/10 rounded-[24px] h-full relative overflow-hidden group-hover:bg-surface-variant/20 transition-all duration-500 border border-outline/5 shadow-inner">
                                            <motion.div
                                                initial={{ height: 0 }}
                                                animate={{ height: `${heightPct}%` }}
                                                transition={{ delay: 0.1, duration: 1.2, ease: "circOut" }}
                                                className={`absolute bottom-0 w-full rounded-[24px] opacity-90 shadow-lg ${config ? 'bg-primary' : 'bg-outline/10'}`}
                                            >
                                                {day.log && <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />}
                                            </motion.div>
                                        </div>
                                    </div>

                                    <span className={`text-[10px] font-black tracking-[0.2em] uppercase transition-colors duration-300 ${day.key === new Date().toISOString().split('T')[0] ? 'text-primary' : 'text-on-surface-variant/30'}`}>
                                        {day.date.toLocaleDateString("es", { weekday: "short" })}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </motion.div>
    );
}
