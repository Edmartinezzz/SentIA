"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, Volume2, VolumeX, Sparkles, Bell } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Props = {
    userId?: string | null;
    onComplete?: (minutes: number) => void;
};

export default function MeditationTimer({ userId, onComplete }: Props) {
    const [duration, setDuration] = useState(5); // en minutos
    const [timeLeft, setTimeLeft] = useState(5 * 60);
    const [isActive, setIsActive] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(true);

    // Audio refs
    const bellAudioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        // Inicializar audio con fallback si no existe bol-tibetano
        bellAudioRef.current = new Audio("/sounds/forest.mp3"); // Cambiado a forest.mp3 que sí existe
    }, []);

    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((time) => time - 1);
            }, 1000);
        } else if (isActive && timeLeft === 0) {
            setIsActive(false);
            handleComplete();
        }

        return () => clearInterval(interval);
    }, [isActive, timeLeft]);

    const handleComplete = async () => {
        if (soundEnabled && bellAudioRef.current) {
            bellAudioRef.current.currentTime = 0;
            bellAudioRef.current.play().catch(e => console.log("Audio play failed:", e));
        }

        if (onComplete) {
            onComplete(duration);
        }
    };

    const toggleTimer = () => {
        setIsActive(!isActive);
    };

    const resetTimer = () => {
        setIsActive(false);
        setTimeLeft(duration * 60);
    };

    const changeDuration = (mins: number) => {
        if (isActive) setIsActive(false);
        setDuration(mins);
        setTimeLeft(mins * 60);
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    };

    return (
        <div className="liquid-glass rounded-[2.5rem] p-8 md:p-12 shadow-2xl border border-white/20 relative overflow-hidden flex flex-col items-center justify-center min-h-[400px]">

            {/* Background Breathing Animation */}
            <AnimatePresence>
                {isActive && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{
                            opacity: [0.1, 0.3, 0.1],
                            scale: [0.8, 1.2, 0.8]
                        }}
                        transition={{
                            duration: 8, // 4s in, 4s out aprox
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                        className="absolute inset-0 m-auto w-[150%] h-[150%] bg-gradient-radial from-violet-500/20 to-transparent rounded-full pointer-events-none"
                    />
                )}
            </AnimatePresence>

            <div className="relative z-10 w-full max-w-md mx-auto flex flex-col items-center">

                <div className="flex items-center gap-3 mb-8 text-violet-600 dark:text-violet-400">
                    <Sparkles className="h-6 w-6" />
                    <h2 className="text-xl font-black uppercase tracking-widest text-sm">Meditación Guiada</h2>
                </div>

                {/* Círculo del Timer */}
                <div className="relative w-64 h-64 flex items-center justify-center mb-10">
                    {/* Anillo exterior decorativo */}
                    <svg className="absolute inset-0 w-full h-full -rotate-90">
                        <circle
                            cx="128"
                            cy="128"
                            r="120"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="transparent"
                            className="text-slate-200 dark:text-white/5"
                        />
                        <motion.circle
                            cx="128"
                            cy="128"
                            r="120"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="transparent"
                            strokeLinecap="round"
                            className="text-primary"
                            initial={{ strokeDasharray: 753.98, strokeDashoffset: 753.98 }}
                            animate={{ strokeDashoffset: (timeLeft / (duration * 60)) * 753.98 }}
                            transition={{ duration: 1, ease: "linear" }}
                        />
                    </svg>

                    <div className="text-center">
                        <div className="text-6xl font-black text-slate-800 dark:text-slate-100 font-mono tracking-tighter">
                            {formatTime(timeLeft)}
                        </div>
                        <div className="text-slate-400 dark:text-slate-500 font-bold tracking-widest uppercase text-xs mt-2">
                            {isActive ? "Respira..." : "Pausado"}
                        </div>
                    </div>
                </div>

                {/* Controles */}
                <div className="flex flex-col items-center gap-8 w-full">

                    {/* Tiempos */}
                    <div className="flex items-center gap-3 bg-white/40 dark:bg-white/5 p-2 rounded-2xl border border-white/20">
                        {[5, 10, 15].map(mins => (
                            <button
                                key={mins}
                                onClick={() => changeDuration(mins)}
                                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${duration === mins && !isActive ? 'bg-white dark:bg-slate-700 text-violet-600 dark:text-violet-300 shadow-sm' : 'text-slate-500 hover:bg-white/50 dark:hover:bg-white/10'}`}
                                disabled={isActive}
                            >
                                {mins}m
                            </button>
                        ))}
                    </div>

                    {/* Play/Pause/Reset */}
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => setSoundEnabled(!soundEnabled)}
                            className="p-4 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/10 transition-colors"
                        >
                            {soundEnabled ? <Volume2 className="h-6 w-6" /> : <VolumeX className="h-6 w-6" />}
                        </button>

                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={toggleTimer}
                            className={`h-20 w-20 flex items-center justify-center rounded-3xl shadow-xl transition-colors
                        ${isActive ? 'bg-rose-500 text-white shadow-rose-500/30' : 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-violet-500/30'}
                    `}
                        >
                            {isActive ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8 ml-2" />}
                        </motion.button>

                        <button
                            onClick={resetTimer}
                            className="p-4 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/10 transition-colors"
                        >
                            <RotateCcw className="h-6 w-6" />
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}
