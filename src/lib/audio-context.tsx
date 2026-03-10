"use client";

import React, { createContext, useContext, useState, useRef, useEffect } from "react";

export type Sound = {
    id: string;
    name: string;
    url: string;
    image: string;
    icon: any; // Lucide Icon
    color: string;
    accent: string;
};

type AudioContextType = {
    isPlaying: boolean;
    activeSound: Sound | null;
    volume: number;
    suggestedSoundId: string | null;
    togglePlay: () => void;
    playSound: (sound: Sound) => void;
    pauseSound: () => void;
    setVolume: (volume: number) => void;
    suggestSound: (mood: string) => void;
    clearSuggestion: () => void;
};

const AudioContext = createContext<AudioContextType | undefined>(undefined);

import { CloudRain, Wind, Flame, Waves } from "lucide-react";

export const ALL_SOUNDS: Sound[] = [
    {
        id: "rain",
        name: "Lluvia en el Cristal",
        image: "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&q=80&w=800",
        url: "/sounds/rain.mp3",
        icon: CloudRain,
        color: "from-blue-500/20 to-indigo-500/20",
        accent: "text-blue-400"
    },
    {
        id: "forest",
        name: "Bosque Profundo",
        image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=800",
        url: "/sounds/forest.mp3",
        icon: Wind,
        color: "from-emerald-500/20 to-teal-500/20",
        accent: "text-emerald-400"
    },
    {
        id: "fire",
        name: "Hoguera Nocturna",
        image: "https://images.unsplash.com/photo-1526481285227-fadc6293992d?auto=format&fit=crop&q=80&w=800",
        url: "/sounds/fire.mp3",
        icon: Flame,
        color: "from-orange-500/20 to-rose-500/20",
        accent: "text-orange-400"
    },
    {
        id: "ocean",
        name: "Océano Infinito",
        image: "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?auto=format&fit=crop&q=80&w=800",
        url: "/sounds/ocean.mp3",
        icon: Waves,
        color: "from-cyan-500/20 to-blue-500/20",
        accent: "text-cyan-400"
    }
];

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [activeSound, setActiveSound] = useState<Sound | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(0.5);
    const [suggestedSoundId, setSuggestedSoundId] = useState<string | null>(null);

    const togglePlay = () => setIsPlaying(prev => !prev);

    const playSound = (sound: Sound) => {
        setActiveSound(sound);
        setIsPlaying(true);
    };

    const pauseSound = () => setIsPlaying(false);

    const suggestSound = (mood: string) => {
        // Map mood to sound
        let soundId: string | null = null;
        if (mood === "anxiety" || mood === "anger") {
            soundId = "ocean";
        } else if (mood === "sadness") {
            soundId = "fire";
        } else if (mood === "joy" || mood === "calm") {
            soundId = "forest";
        }

        if (soundId && soundId !== activeSound?.id) {
            setSuggestedSoundId(soundId);
        }
    };

    const clearSuggestion = () => setSuggestedSoundId(null);

    return (
        <AudioContext.Provider value={{
            isPlaying,
            activeSound,
            volume,
            suggestedSoundId,
            togglePlay,
            playSound,
            pauseSound,
            setVolume,
            suggestSound,
            clearSuggestion
        }}>
            {children}
        </AudioContext.Provider>
    );
};

export const useAudio = () => {
    const context = useContext(AudioContext);
    if (!context) throw new Error("useAudio must be used within AudioProvider");
    return context;
};

