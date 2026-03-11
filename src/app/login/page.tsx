"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Mail, ArrowRight, UserCircle2, Lock } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLogin, setIsLogin] = useState(true);
    const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus("loading");
        setErrorMessage(null);

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (error) throw error;

                router.push("/chat/");
            } else {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: window.location.origin + "/chat/",
                    },
                });

                if (error) throw error;

                // Si el registro es exitoso y no requiere confirmación, lo enviamos al chat
                router.push("/chat/");
            }
        } catch (err: any) {
            setErrorMessage(err.message || "Algo salió mal. Intenta de nuevo.");
            setStatus("error");
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background elements to match app style */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/10 rounded-full blur-[120px] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full"
            >
                <div className="text-center mb-8">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-[24px] bg-gradient-to-br from-primary to-[#008B8B] text-on-primary shadow-lg mb-4">
                        <Sparkles className="h-8 w-8" />
                    </div>
                    <h1 className="text-3xl font-black tracking-tight text-on-surface">SentIA</h1>
                    <p className="text-on-surface-variant font-medium mt-2">Tu camino hacia la claridad comienza aquí</p>
                </div>

                <div className="bg-surface-container border border-outline/10 p-8 rounded-[32px] shadow-sm backdrop-blur-xl">
                    <AnimatePresence mode="wait">
                        <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <div className="flex p-1 bg-surface-variant/30 rounded-2xl mb-8">
                                <button
                                    onClick={() => setIsLogin(true)}
                                    className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${isLogin ? "bg-primary text-on-primary shadow-md" : "text-on-surface-variant hover:text-on-surface"}`}
                                >
                                    Iniciar Sesión
                                </button>
                                <button
                                    onClick={() => setIsLogin(false)}
                                    className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${!isLogin ? "bg-primary text-on-primary shadow-md" : "text-on-surface-variant hover:text-on-surface"}`}
                                >
                                    Registrarse
                                </button>
                            </div>

                            <form onSubmit={handleAuth} className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-2">Correo Electrónico</label>
                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-on-surface-variant group-focus-within:text-primary transition-colors" />
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="tu@correo.com"
                                            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-surface-variant/20 border border-outline/5 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-surface-variant/40 transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-2">Contraseña</label>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-on-surface-variant group-focus-within:text-primary transition-colors" />
                                        <input
                                            type="password"
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-surface-variant/20 border border-outline/5 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-surface-variant/40 transition-all"
                                        />
                                    </div>
                                </div>

                                {errorMessage && (
                                    <motion.p
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="text-xs font-bold text-red-500 bg-red-500/10 p-3 rounded-xl text-center"
                                    >
                                        {errorMessage}
                                    </motion.p>
                                )}

                                <button
                                    type="submit"
                                    disabled={status === "loading"}
                                    className="w-full py-4 rounded-[20px] bg-gradient-to-r from-primary to-[#008B8B] text-on-primary font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 mt-4 flex items-center justify-center gap-2"
                                >
                                    {status === "loading" ? (
                                        <div className="h-5 w-5 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            {isLogin ? "Entrar ahora" : "Crear mi cuenta"}
                                            <ArrowRight className="h-5 w-5" />
                                        </>
                                    )}
                                </button>
                            </form>

                            <p className="mt-8 text-center text-[11px] text-on-surface-variant/60 leading-relaxed font-medium">
                                Al continuar, aceptas que SentIA es una herramienta de apoyo emocional y no reemplaza el tratamiento profesional de salud mental.
                            </p>
                        </motion.div>
                    </AnimatePresence>
                </div>

                <div className="mt-8 text-center">
                    <a href="/" className="text-sm font-bold text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center gap-2">
                        Volver a la página principal
                    </a>
                </div>
            </motion.div>
        </div>
    );
}
