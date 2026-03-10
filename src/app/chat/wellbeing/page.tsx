"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wind, Play, Pause, RotateCcw, ChevronRight, Eye, Hand, Volume2, Search, Coffee, Sparkles, PencilLine, Headphones, Timer } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";

const MeditationTimer = dynamic(() => import("@/components/MeditationTimer"), { ssr: false });
const DailyMissions = dynamic(() => import("@/components/DailyMissions"), { ssr: false });
import { supabase } from "@/lib/supabase";


type BreathingPattern = {
    name: string;
    description: string;
    inhale: number;
    hold?: number;
    exhale: number;
    holdPost?: number;
};

const patterns: BreathingPattern[] = [
    {
        name: "Respiración Equilibrada",
        description: "Ayuda a calmar el sistema nervioso de forma suave.",
        inhale: 4,
        exhale: 4,
    },
    {
        name: "Técnica 4-7-8",
        description: "Ideal para reducir la ansiedad y ayudar a dormir.",
        inhale: 4,
        hold: 7,
        exhale: 8,
    },
    {
        name: "Respiración Cuadrada",
        description: "Aumenta el enfoque mental y reduce el estrés agudo.",
        inhale: 4,
        hold: 4,
        exhale: 4,
        holdPost: 4,
    },
];

const groundingSteps = [
    { count: 5, label: "Cosas que puedes ver", icon: Eye, color: "text-blue-500", bg: "bg-blue-100/10" },
    { count: 4, label: "Cosas que puedes tocar", icon: Hand, color: "text-emerald-500", bg: "bg-emerald-100/10" },
    { count: 3, label: "Cosas que puedes oír", icon: Volume2, color: "text-amber-500", bg: "bg-amber-100/10" },
    { count: 2, label: "Cosas que puedes oler", icon: Search, color: "text-violet-500", bg: "bg-violet-100/10" },
    { count: 1, label: "Cosa que puedes saborear", icon: Coffee, color: "text-rose-500", bg: "bg-rose-100/10" },
];

export default function WellbeingPage() {
    const [userId, setUserId] = useState<string | null>(null);
    const [mode, setMode] = useState<"menu" | "breathing" | "grounding">("menu");

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUserId(session?.user?.id ?? null);
        });
    }, []);
    const [selectedPattern, setSelectedPattern] = useState<BreathingPattern | null>(null);
    const [isActive, setIsActive] = useState(false);
    const [phase, setPhase] = useState<"inhale" | "hold" | "exhale" | "holdPost">("inhale");
    const [timeLeft, setTimeLeft] = useState(0);

    // Grounding states
    const [groundingIndex, setGroundingIndex] = useState(0);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (isActive && selectedPattern && mode === "breathing") {
            if (timeLeft > 0) {
                timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
            } else {
                if (phase === "inhale") {
                    if (selectedPattern.hold) {
                        setPhase("hold");
                        setTimeLeft(selectedPattern.hold);
                    } else {
                        setPhase("exhale");
                        setTimeLeft(selectedPattern.exhale);
                    }
                } else if (phase === "hold") {
                    setPhase("exhale");
                    setTimeLeft(selectedPattern.exhale);
                } else if (phase === "exhale") {
                    if (selectedPattern.holdPost) {
                        setPhase("holdPost");
                        setTimeLeft(selectedPattern.holdPost);
                    } else {
                        setPhase("inhale");
                        setTimeLeft(selectedPattern.inhale);
                    }
                } else if (phase === "holdPost") {
                    setPhase("inhale");
                    setTimeLeft(selectedPattern.inhale);
                }
            }
        }
        return () => clearTimeout(timer);
    }, [isActive, timeLeft, phase, selectedPattern, mode]);

    const startBreathing = (pattern: BreathingPattern) => {
        setSelectedPattern(pattern);
        setMode("breathing");
        setPhase("inhale");
        setTimeLeft(pattern.inhale);
        setIsActive(true);
    };

    const nextGrounding = () => {
        if (groundingIndex < groundingSteps.length - 1) {
            setGroundingIndex(groundingIndex + 1);
        } else {
            reset();
        }
    };

    const reset = () => {
        setIsActive(false);
        setSelectedPattern(null);
        setMode("menu");
        setGroundingIndex(0);
    };

    return (
        <div className="flex h-full flex-col gap-10 bg-background px-4 py-8 md:px-10 overflow-y-auto scrollbar-hide relative z-10">
            <div className="relative z-10">
                <h1 className="text-4xl font-bold tracking-tight text-primary">Kit de Bienestar</h1>
                <p className="mt-2 text-lg text-on-surface-variant font-medium max-w-2xl">
                    Herramientas diseñadas por expertos para ayudarte a recuperar el equilibrio en momentos de estrés o ansiedad.
                </p>
            </div>

            <AnimatePresence mode="wait">
                {mode === "menu" ? (
                    <motion.div
                        key="selection"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="space-y-12 pb-20"
                    >
                        {/* Daily Missions Gamification Section */}
                        <section className="space-y-6">
                            <DailyMissions userId={userId} />
                        </section>

                        {/* Respiración Section */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-3 text-secondary">
                                <Wind className="h-6 w-6" />
                                <h1 className="text-[13px] font-bold tracking-[0.2em] uppercase">Respiración Guiada</h1>
                            </div>
                            <div className="grid gap-6 md:grid-cols-3">
                                {patterns.map((p, i) => (
                                    <motion.button
                                        key={p.name}
                                        whileHover={{ y: -8 }}
                                        onClick={() => startBreathing(p)}
                                        className="group relative flex flex-col items-start rounded-[32px] bg-surface-container p-8 text-left shadow-sm border border-outline/5 transition-all duration-300"
                                    >
                                        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-container text-primary shadow-sm group-hover:scale-110 transition-transform">
                                            <Wind className="h-7 w-7" />
                                        </div>
                                        <h3 className="text-xl font-bold text-on-surface mb-2">{p.name}</h3>
                                        <p className="text-[14px] font-medium text-on-surface-variant leading-relaxed">
                                            {p.description}
                                        </p>
                                        <div className="mt-6 flex items-center gap-2 text-primary font-bold text-sm">
                                            Comenzar <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                        </div>
                                    </motion.button>
                                ))}
                            </div>
                        </section>

                        {/* Grounding Section */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-3 text-secondary">
                                <Eye className="h-6 w-6" />
                                <h1 className="text-[13px] font-bold tracking-[0.2em] uppercase">Técnicas de Grounding</h1>
                            </div>
                            <div className="grid gap-6 md:grid-cols-1">
                                <motion.button
                                    whileHover={{ scale: 1.01 }}
                                    onClick={() => setMode("grounding")}
                                    className="group relative flex items-center justify-between rounded-[32px] bg-surface-container p-10 text-left shadow-sm border border-outline/5 transition-all duration-300"
                                >
                                    <div className="flex items-center gap-8">
                                        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-secondary-container text-secondary shadow-lg group-hover:rotate-6 transition-transform">
                                            <Search className="h-10 w-10" />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-bold text-on-surface mb-2">Técnica de Grounding 5-4-3-2-1</h3>
                                            <p className="text-lg text-on-surface-variant font-medium max-w-xl">
                                                Reconecta con el presente cuando te sientas abrumado usando tus cinco sentidos.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary-container/50 text-secondary">
                                        <ChevronRight className="h-8 w-8" />
                                    </div>
                                </motion.button>
                            </div>
                        </section>

                        {/* Temporizador de Meditación */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-3 text-secondary">
                                <Timer className="h-6 w-6" />
                                <h1 className="text-[13px] font-bold tracking-[0.2em] uppercase">Meditación Libre</h1>
                            </div>
                            <div className="rounded-[32px] bg-surface-container p-1 shadow-sm border border-outline/5">
                                <MeditationTimer />
                            </div>
                        </section>

                        {/* Bienestar Inmersivo Section */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-3 text-secondary">
                                <Sparkles className="h-6 w-6" />
                                <h1 className="text-[13px] font-bold tracking-[0.2em] uppercase">Bienestar Inmersivo</h1>
                            </div>
                            <div className="grid gap-6 md:grid-cols-2">
                                <Link href="/chat/journal">
                                    <motion.div
                                        whileHover={{ y: -8 }}
                                        className="group relative flex flex-col items-start rounded-[32px] bg-surface-container p-8 text-left shadow-sm border border-outline/5 transition-all duration-300 cursor-pointer"
                                    >
                                        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-container text-primary shadow-sm transition-transform">
                                            <PencilLine className="h-7 w-7" />
                                        </div>
                                        <h3 className="text-xl font-bold text-on-surface mb-2">Diario Reflexivo</h3>
                                        <p className="text-[14px] font-medium text-on-surface-variant leading-relaxed">
                                            Escribe tus pensamientos y recibe guías de reflexión personalizadas.
                                        </p>
                                    </motion.div>
                                </Link>

                                <Link href="/chat/sounds">
                                    <motion.div
                                        whileHover={{ y: -8 }}
                                        className="group relative flex flex-col items-start rounded-[32px] bg-surface-container p-8 text-left shadow-sm border border-outline/5 transition-all duration-300 cursor-pointer"
                                    >
                                        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary-container text-secondary shadow-sm transition-transform">
                                            <Headphones className="h-7 w-7" />
                                        </div>
                                        <h3 className="text-xl font-bold text-on-surface mb-2">Paisajes Sonoros</h3>
                                        <p className="text-[14px] font-medium text-on-surface-variant leading-relaxed">
                                            Relájate con sonidos ambientales de alta calidad diseñados para el enfoque.
                                        </p>
                                    </motion.div>
                                </Link>
                            </div>
                        </section>
                    </motion.div>
                ) : mode === "breathing" ? (
                    <motion.div
                        key="exercise"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.1 }}
                        className="flex flex-1 flex-col items-center justify-center text-center py-10"
                    >
                        <div className="relative mb-20 flex h-80 w-80 items-center justify-center">
                            {/* Main Breathing Orb using MD3 colors */}
                            <motion.div
                                animate={{
                                    scale: phase === "inhale" ? [1, 1.6] : phase === "exhale" ? [1.6, 1] : phase === "hold" ? 1.6 : 1,
                                }}
                                transition={{ duration: timeLeft, ease: "easeInOut" }}
                                className="relative flex h-52 w-52 items-center justify-center rounded-full bg-primary shadow-xl border-4 border-primary-container/30"
                            >
                                <Wind className="h-20 w-20 text-on-primary drop-shadow-sm" />
                            </motion.div>

                            {/* Phase Text with MD3 typography */}
                            <div className="absolute -bottom-24 w-full text-center">
                                <motion.span
                                    key={phase}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-4xl font-bold tracking-tight text-primary drop-shadow-sm"
                                >
                                    {phase === "inhale" ? "Inhala" : phase === "hold" ? "Mantén" : phase === "exhale" ? "Exhala" : "Pausa"}
                                </motion.span>
                                <p className="mt-3 text-2xl font-bold text-on-surface-variant tracking-widest">{timeLeft}s</p>
                            </div>
                        </div>

                        <div className="mt-16 space-y-10">
                            <h2 className="text-3xl font-bold text-on-surface">{selectedPattern?.name}</h2>
                            <div className="flex gap-6 justify-center">
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setIsActive(!isActive)}
                                    className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-on-primary shadow-lg"
                                >
                                    {isActive ? <Pause className="h-10 w-10" /> : <Play className="h-10 w-10 ml-1" />}
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.1, rotate: -45 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={reset}
                                    className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-outline text-on-surface-variant hover:bg-surface-variant/20 transition-all"
                                >
                                    <RotateCcw className="h-8 w-8" />
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="grounding"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="flex flex-1 flex-col items-center justify-center py-10"
                    >
                        <div className="max-w-xl w-full text-center space-y-12 bg-surface-container rounded-[40px] p-12 border border-outline/5 shadow-sm">
                            <div className="space-y-4">
                                <h2 className="text-[13px] font-bold uppercase tracking-[0.3em] text-secondary">Técnica 5-4-3-2-1</h2>
                                <h3 className="text-4xl font-bold text-on-surface tracking-tight leading-tight">
                                    Encuentra {groundingSteps[groundingIndex].count} {groundingSteps[groundingIndex].label.split(" ").slice(1).join(" ")}
                                </h3>
                            </div>

                            <motion.div
                                key={groundingIndex}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className={`h-64 w-64 mx-auto flex items-center justify-center rounded-[40px] ${groundingSteps[groundingIndex].bg} shadow-sm border border-outline/10 relative overflow-hidden`}
                            >
                                {(() => {
                                    const StepIcon = groundingSteps[groundingIndex].icon;
                                    return <StepIcon className={`h-32 w-32 ${groundingSteps[groundingIndex].color} drop-shadow-md`} />;
                                })()}

                                <div className="absolute -bottom-6 -right-6 text-[120px] font-bold text-on-surface/5">
                                    {groundingSteps[groundingIndex].count}
                                </div>
                            </motion.div>

                            <p className="text-lg font-medium text-on-surface-variant leading-relaxed px-4">
                                Tómate tu tiempo. Observa tu entorno y cuando estés listo, presiona el botón.
                            </p>

                            <div className="flex flex-col items-center gap-6">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={nextGrounding}
                                    className="bg-primary text-on-primary px-12 py-5 rounded-full font-bold text-xl shadow-lg flex items-center gap-3 transition-brightness hover:brightness-105"
                                >
                                    {groundingIndex < groundingSteps.length - 1 ? (
                                        <>Hecho <ChevronRight className="h-6 w-6" /></>
                                    ) : "Terminar sesión"}
                                </motion.button>

                                <button
                                    onClick={reset}
                                    className="text-sm font-bold text-on-surface-variant hover:text-primary transition-colors uppercase tracking-widest"
                                >
                                    Cancelar ejercicio
                                </button>
                            </div>

                            {/* Progress bar using MD3 tonal indicators */}
                            <div className="flex gap-3 justify-center pt-4">
                                {groundingSteps.map((_, i) => (
                                    <div
                                        key={i}
                                        className={`h-2 w-16 rounded-full transition-all duration-500 ${i <= groundingIndex ? "bg-primary shadow-sm" : "bg-outline/20"}`}
                                    />
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

