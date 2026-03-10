"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    PencilLine, Sparkles, BookOpen, Clock, Calendar,
    ChevronRight, Save, Trash2, Quote, History,
    RefreshCw, X, Maximize2, Minimize2, Brain, AlertCircle, CheckCircle2
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { ClientLiquidBackground } from "@/components/layout/ClientLiquidBackground";

type JournalAnalysis = {
    mood: string;
    distortions: string[];
    reframe: string;
    category: string;
    has_distortions: boolean;
};

type JournalEntry = {
    id: string;
    content: string;
    prompt: string;
    mood: string;
    created_at: string;
    analysis?: JournalAnalysis;
};

const MOOD_PROMPTS: Record<string, string> = {
    joy: "¿Qué momento de hoy te hizo sentir más vivo/a?",
    sadness: "Si tu tristeza fuera un paisaje, ¿cómo se vería y qué necesita ese lugar para sanar?",
    anxiety: "Escribe sobre tres cosas que están bajo tu control en este momento.",
    anger: "¿Qué límite tuyo fue cruzado hoy y cómo puedes comunicarlo con asertividad?",
    calm: "Describe esta sensación de paz. ¿Cómo puedes volver a ella cuando las cosas se pongan difíciles?",
    default: "¿Qué es lo que más ocupa tu mente en este momento?"
};

export default function JournalPage() {
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [content, setContent] = useState("");
    const [currentPrompt, setCurrentPrompt] = useState("");
    const [mood, setMood] = useState("default");
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [isFocusMode, setIsFocusMode] = useState(false);
    const [lastAnalysis, setLastAnalysis] = useState<JournalAnalysis | null>(null);
    const [showAnalysisModal, setShowAnalysisModal] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        const fetchUserData = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                const uid = session.user.id;
                setUserId(uid);

                // 1. Cargar el ánimo más reciente para el prompt
                const { data: emotionLog } = await supabase
                    .from("emotion_logs")
                    .select("mood")
                    .eq("user_id", uid)
                    .order("created_at", { ascending: false })
                    .limit(1)
                    .maybeSingle();

                const detectedMood = emotionLog?.mood || "default";
                setMood(detectedMood);
                setCurrentPrompt(MOOD_PROMPTS[detectedMood] || MOOD_PROMPTS.default);

                // 2. Cargar entradas anteriores
                const { data: journalEntries } = await supabase
                    .from("journal_entries")
                    .select("*")
                    .eq("user_id", uid)
                    .order("created_at", { ascending: false });

                if (journalEntries) setEntries(journalEntries);
            }
            setIsLoading(false);
        };

        fetchUserData();
    }, []);

    const handleSave = async () => {
        if (!content.trim() || !userId) return;
        setIsSaving(true);
        setIsAnalyzing(true);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            // 1. Analizar con IA primero
            const analyzeResp = await fetch("/api/journal/analyze", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${session.access_token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ content: content.trim() })
            });

            let analysisResult = null;
            if (analyzeResp.ok) {
                const analysisData = await analyzeResp.json();
                analysisResult = analysisData.analysis;
                setLastAnalysis(analysisResult);
            }

            // 2. Guardar en Supabase
            const { data, error } = await supabase
                .from("journal_entries")
                .insert({
                    user_id: userId,
                    content: content.trim(),
                    prompt: currentPrompt,
                    mood: analysisResult?.mood || mood
                })
                .select()
                .single();

            if (!error && data) {
                setEntries([{ ...data, analysis: analysisResult }, ...entries]);
                setContent("");
                setIsFocusMode(false);

                if (analysisResult) {
                    setShowAnalysisModal(true);
                }

                // Generar un nuevo prompt aleatorio después de guardar
                const moods = Object.keys(MOOD_PROMPTS);
                const randomMood = moods[Math.floor(Math.random() * moods.length)];
                setCurrentPrompt(MOOD_PROMPTS[randomMood]);
            }
        } catch (err) {
            console.error("Error saving journal entry:", err);
        } finally {
            setIsSaving(false);
            setIsAnalyzing(false);
        }
    };

    const handleDelete = async (id: string) => {
        const { error } = await supabase
            .from("journal_entries")
            .delete()
            .eq("id", id);

        if (!error) {
            setEntries(entries.filter(e => e.id !== id));
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center bg-background">
                <RefreshCw className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="relative flex h-full flex-col bg-background overflow-hidden">
            <ClientLiquidBackground />

            <div className="relative z-10 flex h-full flex-col gap-8 px-4 py-8 md:px-10 overflow-y-auto scrollbar-hide">
                {/* Header - Ocultar en Focus Mode */}
                {!isFocusMode && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col md:flex-row md:items-center justify-between gap-6"
                    >
                        <div>
                            <h1 className="text-4xl font-extrabold tracking-tight text-on-surface">
                                Diario <span className="text-primary italic">Reflexivo</span>
                            </h1>
                            <p className="mt-2 text-lg text-on-surface-variant font-medium">
                                Tu espacio seguro para la claridad mental.
                            </p>
                        </div>
                        <div className="flex items-center gap-4 px-6 py-4 rounded-3xl bg-surface-container-high/50 backdrop-blur-md text-on-surface border border-outline/10 shadow-sm">
                            <History className="h-5 w-5 text-primary" />
                            <span className="font-bold text-sm uppercase tracking-widest">{entries.length} Entradas</span>
                        </div>
                    </motion.div>
                )}

                <div className={`grid gap-10 transition-all duration-500 ${isFocusMode ? 'lg:grid-cols-1 max-w-4xl mx-auto w-full' : 'lg:grid-cols-3'}`}>

                    {/* Editor Section */}
                    <div className={`${isFocusMode ? '' : 'lg:col-span-2'} space-y-8`}>
                        <motion.div
                            layout
                            className={`rounded-[40px] p-8 md:p-10 shadow-2xl border border-outline/10 relative overflow-hidden transition-all duration-500 ${isFocusMode ? 'bg-surface-container-highest/60' : 'bg-surface-container-low/40'
                                } backdrop-blur-xl`}
                        >
                            <div className="mb-8 flex items-center justify-between">
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-xl bg-primary/20 flex items-center justify-center">
                                            <Sparkles className="h-4 w-4 text-primary" />
                                        </div>
                                        <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary/80">Guía Terapéutica</span>
                                    </div>
                                    <h2 className={`text-2xl font-bold italic leading-tight transition-all duration-500 ${isFocusMode ? 'text-on-surface text-3xl' : 'text-on-surface-variant opacity-80'}`}>
                                        "{currentPrompt}"
                                    </h2>
                                </div>
                                <button
                                    onClick={() => setIsFocusMode(!isFocusMode)}
                                    className="p-3 rounded-2xl bg-surface-variant/30 hover:bg-primary/20 text-on-surface-variant transition-all"
                                    title={isFocusMode ? "Salir de modo enfoque" : "Modo enfoque"}
                                >
                                    {isFocusMode ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
                                </button>
                            </div>

                            <div className="relative">
                                <textarea
                                    ref={textareaRef}
                                    value={content}
                                    onChange={(e) => {
                                        setContent(e.target.value);
                                        if (e.target.value.length > 50 && !isFocusMode) setIsFocusMode(true);
                                    }}
                                    placeholder="Libera tus pensamientos aquí..."
                                    className={`w-full transition-all duration-500 rounded-[32px] bg-white/5 border-2 border-transparent focus:border-primary/30 focus:outline-none text-on-surface placeholder:opacity-30 resize-none scrollbar-hide font-medium leading-relaxed ${isFocusMode ? 'min-h-[500px] text-2xl p-10' : 'min-h-[300px] text-xl p-8 shadow-inner'
                                        }`}
                                />

                                <div className="mt-8 flex justify-between items-center">
                                    <div className="text-xs font-bold text-outline uppercase tracking-widest pl-4">
                                        {content.length} caracteres
                                    </div>
                                    <motion.button
                                        whileHover={{ scale: 1.05, boxShadow: "0 10px 40px -10px rgba(0, 106, 106, 0.4)" }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={handleSave}
                                        disabled={isSaving || content.length < 10}
                                        className="btn-primary-md3 px-8 py-5 flex items-center gap-3 disabled:opacity-50"
                                    >
                                        {isSaving ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                                        <span className="text-base">Guardar y Analizar</span>
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Sidebar - Recent Entries (Ocultar en Focus Mode) */}
                    {!isFocusMode && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="space-y-6"
                        >
                            <div className="flex items-center justify-between px-4 mb-2">
                                <div className="flex items-center gap-3">
                                    <BookOpen className="h-5 w-5 text-secondary" />
                                    <h3 className="font-bold text-lg text-on-surface">Tu Historia</h3>
                                </div>
                                <span className="text-[10px] font-bold text-outline uppercase tracking-widest">Recientes</span>
                            </div>

                            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 scrollbar-hide pb-20">
                                {entries.length > 0 ? (
                                    entries.map((entry, i) => (
                                        <motion.div
                                            key={entry.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            className="liquid-glass group relative p-6 hover:shadow-xl transition-all cursor-pointer overflow-hidden border border-outline/5"
                                        >
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-primary/60 mb-1">
                                                        {new Date(entry.created_at).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' })}
                                                    </span>
                                                    <span className="text-[9px] font-bold text-outline/50 uppercase">
                                                        {new Date(entry.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDelete(entry.id);
                                                    }}
                                                    className="opacity-0 group-hover:opacity-100 p-2 hover:bg-rose-500/10 hover:text-rose-500 rounded-xl transition-all"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                            <p className="text-[14px] font-bold text-on-surface line-clamp-2 leading-relaxed mb-4">
                                                {entry.content}
                                            </p>
                                            <div className="flex items-center gap-2 pt-3 border-t border-outline/5">
                                                <Quote className="h-3 w-3 text-secondary/30" />
                                                <span className="text-[10px] font-bold text-on-surface-variant italic line-clamp-1 opacity-60">
                                                    {entry.prompt}
                                                </span>
                                            </div>
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-20 rounded-[40px] bg-surface-container-low/20 border-2 border-dashed border-outline/10 text-center px-10">
                                        <div className="h-16 w-16 rounded-full bg-surface-variant/30 flex items-center justify-center mb-6">
                                            <PencilLine className="h-8 w-8 text-on-surface-variant/30" />
                                        </div>
                                        <p className="text-xs font-black text-on-surface-variant/40 uppercase tracking-[0.2em] leading-loose">
                                            Empieza a escribir hoy para descubrir patrones en tu mente.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Analysis Modal/Result Panel */}
            <AnimatePresence>
                {showAnalysisModal && lastAnalysis && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md"
                        onClick={() => setShowAnalysisModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="relative w-full max-w-2xl overflow-hidden rounded-[48px] bg-surface-container p-1 pt-1 shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="bg-gradient-to-br from-primary/10 via-surface-container to-secondary/5 p-10 md:p-14">
                                <button
                                    onClick={() => setShowAnalysisModal(false)}
                                    className="absolute right-10 top-10 p-2 rounded-full hover:bg-surface-variant/50 transition-all text-on-surface-variant"
                                >
                                    <X className="h-6 w-6" />
                                </button>

                                <div className="flex items-center gap-4 mb-10">
                                    <div className="h-16 w-16 rounded-3xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                                        <Brain className="h-8 w-8 text-on-primary" />
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-black text-on-surface tracking-tight">Análisis de Clara</h2>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs font-bold uppercase tracking-widest text-primary">CBT Powered Insight</span>
                                            <Sparkles className="h-3 w-3 text-amber-500" />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    {/* Mood & Category */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-6 rounded-[32px] bg-white/5 border border-outline/10 backdrop-blur-sm">
                                            <span className="text-[10px] font-black uppercase text-outline tracking-wider mb-2 block">Ánimo Detectado</span>
                                            <span className="text-xl font-bold text-on-surface">{lastAnalysis.mood}</span>
                                        </div>
                                        <div className="p-6 rounded-[32px] bg-white/5 border border-outline/10 backdrop-blur-sm">
                                            <span className="text-[10px] font-black uppercase text-outline tracking-wider mb-2 block">Categoría</span>
                                            <span className="text-xl font-bold text-on-surface">{lastAnalysis.category}</span>
                                        </div>
                                    </div>

                                    {/* Distortions */}
                                    {lastAnalysis.has_distortions && (
                                        <div className="p-8 rounded-[32px] bg-amber-500/5 border border-amber-500/20">
                                            <div className="flex items-center gap-3 mb-6">
                                                <AlertCircle className="h-5 w-5 text-amber-500" />
                                                <h4 className="font-black text-xs uppercase tracking-widest text-amber-500/80">Patrones Cognitivos Detectados</h4>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {lastAnalysis.distortions.map((d: string, i: number) => (
                                                    <span key={i} className="px-5 py-2.5 rounded-2xl bg-amber-500/10 text-amber-700 text-sm font-bold border border-amber-500/10">
                                                        {d}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Reframe/Insight */}
                                    <div className="p-8 md:p-10 rounded-[40px] bg-primary/5 border border-primary/20 relative overflow-hidden">
                                        <Quote className="absolute -top-4 -left-4 h-24 w-24 text-primary/5 -rotate-12" />
                                        <div className="flex items-center gap-3 mb-6 relative z-10">
                                            <CheckCircle2 className="h-5 w-5 text-primary" />
                                            <h4 className="font-black text-xs uppercase tracking-widest text-primary/80">Replanteamiento de Clara</h4>
                                        </div>
                                        <p className="text-lg md:text-xl font-bold italic leading-relaxed text-on-surface relative z-10">
                                            "{lastAnalysis.reframe}"
                                        </p>
                                    </div>

                                    <button
                                        onClick={() => setShowAnalysisModal(false)}
                                        className="w-full py-6 rounded-full bg-on-surface text-surface text-lg font-black tracking-tight hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl"
                                    >
                                        Entendido, gracias Clara
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
