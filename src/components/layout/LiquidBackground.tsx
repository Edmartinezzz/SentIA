"use client";

import { motion } from "framer-motion";

export const LiquidBackground = () => {
    return (
        <div className="fixed inset-0 -z-10 overflow-hidden bg-surface">
            {/* Background Base Glow */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,var(--md-sys-color-primary-container),transparent)] opacity-20" />

            {/* Hyper-Complex Mesh Gradient */}
            <motion.div
                animate={{
                    x: [0, 40, -20, 0],
                    y: [0, -30, 40, 0],
                    rotate: [0, 15, -15, 0],
                }}
                transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                style={{ willChange: "transform" }}
                className="absolute -top-[20%] -left-[10%] h-[80%] w-[80%] rounded-[40%] bg-primary/10 blur-[80px]"
            />

            <motion.div
                animate={{
                    x: [0, -50, 30, 0],
                    y: [0, 40, -25, 0],
                    rotate: [0, -20, 15, 0],
                }}
                transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
                style={{ willChange: "transform" }}
                className="absolute top-[10%] -right-[20%] h-[90%] w-[90%] rounded-[50%] bg-secondary/5 blur-[90px]"
            />

            <motion.div
                animate={{
                    x: [0, 75, -75, 0],
                    y: [0, 50, -50, 0],
                }}
                transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
                style={{ willChange: "transform" }}
                className="absolute -bottom-[30%] left-[10%] h-[70%] w-[70%] rounded-[30%] bg-primary-container/10 blur-[70px]"
            />

            {/* Subtle Glass Noise Overlay - Reducido para performance */}
            <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03] pointer-events-none mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
        </div>
    );
};

