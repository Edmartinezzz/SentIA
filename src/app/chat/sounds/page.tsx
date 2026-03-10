"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, SkipBack, SkipForward, Volume2, Headphones, Loader2 } from "lucide-react";
import { useAudio, ALL_SOUNDS as SOUNDS, Sound } from "@/lib/audio-context";

export default function SoundsPage() {
    const {
        activeSound,
        isPlaying,
        volume,
        setVolume,
        togglePlay,
        playSound
    } = useAudio();

    const [audioError, setAudioError] = useState<string | null>(null);
    const [isAudioLoading, setIsAudioLoading] = useState(false);

    // Fallback if no sound is active yet
    const currentSound = activeSound || SOUNDS[0];

    const handleSelectSound = (sound: Sound) => {
        if (activeSound?.id === sound.id) {
            togglePlay();
        } else {
            setAudioError(null);
            playSound(sound);
        }
    };

    return (
        <div className="flex h-full flex-col gap-10 bg-background px-4 py-8 md:px-10 overflow-y-auto scrollbar-hide relative z-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight text-primary">
                        Paisajes Sonoros
                    </h1>
                    <p className="mt-2 text-lg text-on-surface-variant font-medium">
                        Sumérgete en ambientes diseñados para tu paz mental.
                    </p>
                </div>
                <div className="flex items-center gap-4 px-6 py-4 rounded-3xl bg-secondary-container text-on-secondary-container shadow-sm border border-secondary-container/10">
                    <Headphones className="h-5 w-5 text-primary animate-pulse" />
                    <span className="font-bold text-sm uppercase tracking-widest">Sonido Inmersivo</span>
                </div>
            </div>

            <div className="grid gap-12 lg:grid-cols-2 items-center h-full max-w-6xl mx-auto w-full pb-10">

                {/* Vinyl/Player Section */}
                <div className="flex flex-col items-center justify-center p-4 relative">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentSound.id}
                            initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
                            animate={{ opacity: 1, scale: 1, rotate: 0 }}
                            exit={{ opacity: 0, scale: 0.8, rotate: 10 }}
                            className="relative w-full aspect-square max-w-[400px]"
                        >
                            {/* Vinyl-like disc with MD3 surface shadow */}
                            <motion.div
                                animate={{ rotate: isPlaying ? 360 : 0 }}
                                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                                className="absolute inset-0 rounded-full border-[12px] border-surface-container-high shadow-xl overflow-hidden"
                            >
                                <img
                                    src={currentSound.image}
                                    className="w-full h-full object-cover opacity-70"
                                    alt={currentSound.name}
                                />
                                <div className="absolute inset-0 bg-gradient-to-tr from-black/40 to-transparent" />
                                <div className="absolute inset-0 rounded-full border-[1px] border-white/5 pointer-events-none" />
                            </motion.div>

                            {/* Center hole with primary accent */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-surface-container-highest border-4 border-surface-container z-20 flex items-center justify-center shadow-lg">
                                <currentSound.icon className={`h-8 w-8 ${currentSound.accent}`} />
                            </div>

                            {/* Floating particles effect */}
                            {isPlaying && (
                                <div className="absolute -inset-10 pointer-events-none overflow-hidden">
                                    {[...Array(12)].map((_, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, y: 0, x: 0 }}
                                            animate={{
                                                opacity: [0, 1, 0],
                                                y: -100,
                                                x: (Math.random() - 0.5) * 100
                                            }}
                                            transition={{
                                                duration: 2 + Math.random() * 2,
                                                repeat: Infinity,
                                                delay: i * 0.5
                                            }}
                                            className="absolute bottom-1/2 left-1/2 w-1 h-1 bg-primary rounded-full blur-[1px]"
                                        />
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>

                    {/* Controls with MD3 Surfaces */}
                    <div className="mt-12 w-full max-w-[450px] bg-surface-container rounded-[40px] p-8 shadow-sm border border-outline/5 flex flex-col items-center gap-8">
                        <div className="text-center">
                            <h2 className="text-2xl font-bold tracking-tight text-on-surface">{currentSound.name}</h2>
                            <p className="text-[13px] font-bold text-on-surface-variant uppercase tracking-widest mt-2">
                                {audioError ? (
                                    <span className="text-error">{audioError}</span>
                                ) : isAudioLoading ? (
                                    <span className="flex items-center gap-2 justify-center">
                                        <Loader2 className="h-4 w-4 animate-spin" /> Cargando ambiente...
                                    </span>
                                ) : (
                                    "Reproduciendo ambiente"
                                )}
                            </p>
                        </div>

                        <div className="flex items-center gap-8">
                            <button className="p-3 text-on-surface-variant hover:text-primary transition-all transform hover:scale-110" aria-label="Anterior">
                                <SkipBack className="h-8 w-8" />
                            </button>
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={togglePlay}
                                disabled={isAudioLoading && !isPlaying}
                                className={`h-20 w-20 rounded-full flex items-center justify-center shadow-lg transition-all ${isAudioLoading && !isPlaying ? 'bg-surface-container-high text-on-surface-variant' : 'bg-primary text-on-primary'}`}
                                aria-label={isPlaying ? "Pausar" : "Reproducir"}
                            >
                                {isAudioLoading && !isPlaying ? (
                                    <Loader2 className="h-10 w-10 animate-spin" />
                                ) : isPlaying ? (
                                    <Pause className="h-10 w-10" />
                                ) : (
                                    <Play className="h-10 w-10 ml-1" />
                                )}
                            </motion.button>
                            <button className="p-3 text-on-surface-variant hover:text-primary transition-all transform hover:scale-110" aria-label="Siguiente">
                                <SkipForward className="h-8 w-8" />
                            </button>
                        </div>

                        <div className="w-full flex items-center gap-4 px-4">
                            <Volume2 className="h-5 w-5 text-on-surface-variant opacity-60" />
                            <div className="flex-1 relative flex items-center h-8">
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.01"
                                    value={volume}
                                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                                    className="w-full h-1.5 bg-surface-container-highest rounded-full appearance-none cursor-pointer accent-primary"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Library Section with Tonal Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 h-fit">
                    {SOUNDS.map((sound) => (
                        <motion.div
                            key={sound.id}
                            whileHover={{ y: -5 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleSelectSound(sound)}
                            className={`relative overflow-hidden rounded-[32px] h-56 cursor-pointer border transition-all ${currentSound.id === sound.id
                                ? 'border-primary bg-primary-container/20 shadow-md'
                                : 'border-outline/5 bg-surface-container hover:bg-surface-container-high'
                                }`}
                        >
                            <img
                                src={sound.image}
                                className="absolute inset-0 w-full h-full object-cover opacity-40 grayscale group-hover:grayscale-0 transition-all duration-700"
                                alt={sound.name}
                            />
                            <div className={`absolute inset-0 bg-gradient-to-t ${sound.color} mix-blend-multiply opacity-30`} />

                            <div className="absolute inset-0 p-8 flex flex-col justify-end">
                                <div className="flex items-center gap-3 mb-2">
                                    <sound.icon className={`h-6 w-6 ${sound.accent}`} />
                                    <h3 className="text-xl font-bold text-on-surface drop-shadow-sm">{sound.name}</h3>
                                </div>
                                {currentSound.id === sound.id && isPlaying && (
                                    <div className="flex gap-1.5 items-end h-5 ml-1">
                                        {[...Array(4)].map((_, i) => (
                                            <motion.div
                                                key={i}
                                                animate={{ height: [4, 16, 8, 12, 4] }}
                                                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                                                className="w-1.5 bg-primary rounded-full"
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}
