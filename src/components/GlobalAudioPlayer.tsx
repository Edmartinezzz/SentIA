"use client";

import { useEffect, useRef } from "react";
import { useAudio } from "@/lib/audio-context";

export const GlobalAudioPlayer = () => {
    const { isPlaying, activeSound, volume } = useAudio();
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
        }
    }, [volume]);

    useEffect(() => {
        if (!audioRef.current) return;

        if (isPlaying && activeSound) {
            audioRef.current.src = activeSound.url;
            audioRef.current.play().catch(err => {
                console.warn("Audio play blocked by browser policy:", err);
            });
        } else {
            audioRef.current.pause();
        }
    }, [isPlaying, activeSound]);

    return (
        <audio
            ref={audioRef}
            loop
            preload="auto"
            style={{ display: "none" }}
        />
    );
};

