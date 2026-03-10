"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Target, Plus, Check, PlusCircle, Trash2, Heart, Moon, Activity, Users, Flame, Zap, X } from "lucide-react";
import { supabase } from "@/lib/supabase";

export type GoalCategory = "mindfulness" | "sleep" | "active" | "social" | "nutrition" | "other";

export type WellnessGoal = {
    id: string;
    title: string;
    category: GoalCategory;
    target_days: number;
    current_days: number;
    is_completed: boolean;
};

const CATEGORY_ICONS: Record<GoalCategory, any> = {
    mindfulness: Heart,
    sleep: Moon,
    active: Activity,
    social: Users,
    nutrition: Flame,
    other: Target
};

const CATEGORY_COLORS: Record<GoalCategory, string> = {
    mindfulness: "text-rose-500 bg-rose-500/10 border-rose-500/20",
    sleep: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
    active: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    social: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    nutrition: "text-orange-500 bg-orange-500/10 border-orange-500/20",
    other: "text-violet-500 bg-violet-500/10 border-violet-500/20"
};

type Props = {
    userId: string | null;
};

export default function WellnessGoals({ userId }: Props) {
    const [goals, setGoals] = useState<WellnessGoal[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);

    // States for new goal form
    const [newTitle, setNewTitle] = useState("");
    const [newCategory, setNewCategory] = useState<GoalCategory>("mindfulness");
    const [newTarget, setNewTarget] = useState(7);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (userId) loadGoals();
        else setLoading(false);
    }, [userId]);

    const loadGoals = async () => {
        const { data } = await supabase
            .from("wellness_goals")
            .select("*")
            .eq("user_id", userId)
            .order("is_completed", { ascending: true })
            .order("created_at", { ascending: false });

        if (data) setGoals(data as WellnessGoal[]);
        setLoading(false);
    };

    const handleAddGoal = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTitle.trim() || !userId) return;

        setSubmitting(true);
        const { data: newGoal, error } = await supabase
            .from("wellness_goals")
            .insert({
                user_id: userId,
                title: newTitle.trim(),
                category: newCategory,
                target_days: newTarget
            })
            .select()
            .single();

        if (!error && newGoal) {
            setGoals([newGoal, ...goals]);
            setIsAdding(false);
            setNewTitle("");
            setNewTarget(7);
        }
        setSubmitting(false);
    };

    const handleProgress = async (id: string, currentDays: number, targetDays: number) => {
        if (!userId) return;

        // Prevent double clicking beyond target
        if (currentDays >= targetDays) return;

        const newCurrent = currentDays + 1;
        const isCompleted = newCurrent >= targetDays;

        // Optimistic update
        setGoals(goals.map(g =>
            g.id === id ? { ...g, current_days: newCurrent, is_completed: isCompleted } : g
        ));

        await supabase
            .from("wellness_goals")
            .update({ current_days: newCurrent, is_completed: isCompleted })
            .eq("id", id)
            .eq("user_id", userId);

        if (isCompleted) {
            // Small delay then sort to move to bottom
            setTimeout(() => loadGoals(), 2000);
        }
    };

    const handleDelete = async (id: string) => {
        if (!userId) return;
        setGoals(goals.filter(g => g.id !== id));
        await supabase.from("wellness_goals").delete().eq("id", id).eq("user_id", userId);
    };

    if (loading) {
        return (
            <div className="liquid-glass rounded-[2.5rem] p-8 min-h-[300px] flex items-center justify-center border border-white/20">
                <div className="animate-spin text-primary-500"><Zap className="h-8 w-8" /></div>
            </div>
        );
    }

    return (
        <div className="bg-surface-container rounded-[32px] p-8 shadow-sm border border-outline/5 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between pointer-events-auto">
                <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary-container text-secondary shadow-sm">
                        <Target className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-on-surface">Metas de Bienestar</h2>
                        <p className="text-sm text-on-surface-variant font-medium">Construye hábitos paso a paso</p>
                    </div>
                </div>

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsAdding(!isAdding)}
                    disabled={!userId}
                    className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold shadow-sm transition-all disabled:opacity-50
            ${isAdding ? 'bg-error-container text-on-error-container hover:brightness-95'
                            : 'bg-primary text-on-primary hover:brightness-110 shadow-md'}
          `}
                >
                    {isAdding ? <><X className="h-4 w-4" /> Cancelar</> : <><Plus className="h-4 w-4" /> Nueva Meta</>}
                </motion.button>
            </div>

            {/* Add New Form - MD3 Style */}
            <AnimatePresence>
                {isAdding && (
                    <motion.form
                        initial={{ opacity: 0, height: 0, y: -20 }}
                        animate={{ opacity: 1, height: "auto", y: 0 }}
                        exit={{ opacity: 0, height: 0, y: -20, overflow: "hidden" }}
                        onSubmit={handleAddGoal}
                        className="bg-surface-container-high rounded-[28px] p-6 border border-outline/10 space-y-5 shadow-sm"
                    >
                        <input
                            type="text"
                            required
                            placeholder="¿Qué hábito quieres construir? (ej. Meditar 10 min)"
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            className="w-full bg-surface-variant/40 border-0 rounded-[18px] px-5 py-3.5 text-sm font-medium focus:ring-2 focus:ring-primary/40 text-on-surface placeholder:text-on-surface-variant/50"
                        />

                        <div className="flex flex-wrap gap-4 items-center justify-between">
                            <div className="flex flex-wrap gap-2">
                                {(Object.keys(CATEGORY_ICONS) as GoalCategory[]).map(cat => {
                                    const Icon = CATEGORY_ICONS[cat];
                                    const isActive = newCategory === cat;
                                    return (
                                        <button
                                            key={cat}
                                            type="button"
                                            onClick={() => setNewCategory(cat)}
                                            className={`p-3 rounded-2xl transition-all border ${isActive ? 'bg-secondary-container text-secondary border-secondary/30 scale-110' : 'bg-surface-variant/30 text-on-surface-variant/60 border-transparent hover:bg-surface-variant/60'}`}
                                            title={cat}
                                        >
                                            <Icon className="h-4 w-4" />
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="flex items-center gap-4">
                                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Duración:</span>
                                <select
                                    value={newTarget}
                                    onChange={(e) => setNewTarget(Number(e.target.value))}
                                    className="bg-surface-variant/40 border-0 rounded-[14px] px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-primary text-on-surface"
                                >
                                    <option value={3}>3 días</option>
                                    <option value={7}>7 días</option>
                                    <option value={14}>14 días</option>
                                    <option value={21}>21 días (Hábito)</option>
                                    <option value={30}>30 días (Reto)</option>
                                </select>
                                <button
                                    type="submit"
                                    disabled={submitting || !newTitle.trim()}
                                    className="bg-primary text-on-primary rounded-full px-6 py-2.5 text-sm font-bold shadow-md hover:brightness-110 transition-all disabled:opacity-50"
                                >
                                    {submitting ? 'Creando...' : 'Guardar Meta'}
                                </button>
                            </div>
                        </div>
                    </motion.form>
                )}
            </AnimatePresence>

            {/* Goals List */}
            {!userId ? (
                <div className="text-center py-10 opacity-60">
                    <Target className="h-14 w-14 mx-auto mb-4 text-on-surface-variant/40" />
                    <p className="text-sm font-medium text-on-surface-variant">Inicia sesión para guardar tus metas de bienestar.</p>
                </div>
            ) : goals.length === 0 ? (
                <div className="text-center py-12 opacity-80">
                    <div className="h-20 w-20 mx-auto mb-6 bg-surface-container-highest rounded-full flex items-center justify-center">
                        <Target className="h-10 w-10 text-primary/40" />
                    </div>
                    <p className="font-bold text-on-surface text-lg">Aún no tienes metas de bienestar.</p>
                    <p className="text-sm mt-2 text-on-surface-variant">¡Presiona 'Nueva Meta' para comenzar tu camino!</p>
                </div>
            ) : (
                <div className="space-y-4">
                    <AnimatePresence>
                        {goals.map((goal) => {
                            const Icon = CATEGORY_ICONS[goal.category];
                            const pct = Math.min(100, (goal.current_days / goal.target_days) * 100);

                            return (
                                <motion.div
                                    key={goal.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95, height: 0 }}
                                    className={`relative overflow-hidden rounded-[28px] border transition-all p-6 bg-surface-container-low shadow-sm
                    ${goal.is_completed ? 'border-primary/20 bg-primary/5' : 'border-outline/5'}`}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-start gap-5">
                                            <div className={`mt-1 p-3.5 rounded-[18px] flex-shrink-0 border transition-colors ${goal.is_completed ? 'bg-primary-container text-primary border-primary/20' : 'bg-surface-variant/40 border-transparent text-on-surface-variant/40'}`}>
                                                {goal.is_completed ? <Check className="h-6 w-6" /> : <Icon className="h-6 w-6" />}
                                            </div>
                                            <div className="space-y-1.5">
                                                <h3 className={`font-bold text-lg leading-tight ${goal.is_completed ? 'line-through text-on-surface-variant/50 decoration-2' : 'text-on-surface'}`}>
                                                    {goal.title}
                                                </h3>
                                                <div className="flex items-center gap-2.5">
                                                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-on-surface-variant/60">Progreso Diario:</span>
                                                    <span className={`text-sm font-bold ${goal.is_completed ? 'text-primary' : 'text-secondary'}`}>
                                                        {goal.current_days} / {goal.target_days} días
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            {/* +1 Button - MD3 Tonal Button Style */}
                                            {!goal.is_completed && (
                                                <motion.button
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => handleProgress(goal.id, goal.current_days, goal.target_days)}
                                                    className="h-11 px-5 rounded-full flex items-center justify-center gap-2 font-bold text-sm bg-secondary text-on-secondary shadow-sm hover:brightness-110 transition-all"
                                                >
                                                    <PlusCircle className="h-4 w-4" />
                                                    Sumar Día
                                                </motion.button>
                                            )}

                                            {/* Delete */}
                                            <button
                                                onClick={() => handleDelete(goal.id)}
                                                className="h-11 w-11 flex items-center justify-center rounded-full text-on-surface-variant/40 hover:bg-error-container hover:text-on-error-container transition-all"
                                                title="Eliminar meta"
                                            >
                                                <Trash2 className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Progress bar MD3 Style */}
                                    <div className="mt-5 h-2 w-full rounded-full bg-surface-variant/30 overflow-hidden relative">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${pct}%` }}
                                            transition={{ duration: 0.6, ease: "circOut" }}
                                            className={`h-full rounded-full ${goal.is_completed ? 'bg-primary' : 'bg-secondary'}`}
                                        />
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}

