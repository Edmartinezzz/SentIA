"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Sparkles, MessageCircleHeart, Mail, ArrowRight, UserCircle2, Lock } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLogged, setIsLogged] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLogged(!!session);
    };
    checkUser();
  }, []);

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

        window.location.href = "/chat";
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin + "/chat",
          },
        });

        if (error) throw error;

        // Si Supabase devuelve una sesión al registrarse (porque quitamos la confirmación de email),
        // o si simplemente el registro fue exitoso, vamos a enviarlo al chat de una vez.
        // Opcionalmente, puedes forzar un login justo después del registro.
        if (data?.session) {
          window.location.href = "/chat";
        } else {
          // En caso de que siga pidiendo confirmación (si no se guardó el cambio en Supabase)
          setStatus("sent");
        }
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      setStatus("error");
      setErrorMessage(error.message);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background">
      {/* Decorative background elements */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="absolute top-1/4 left-1/4 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute right-1/4 bottom-1/4 h-80 w-80 rounded-full bg-secondary/10 blur-3xl" />
      </div>

      <main className="z-10 flex w-full max-w-4xl flex-col items-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="mb-8 flex flex-col items-center"
        >
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-surface-container shadow-xl shadow-primary/10">
            <Sparkles className="h-10 w-10 text-primary" />
          </div>

          <h1 className="mb-4 text-5xl font-bold tracking-tight text-on-surface sm:text-7xl">
            SentIA
          </h1>

          <p className="mb-8 max-w-xl text-xl font-medium leading-relaxed text-on-surface-variant sm:text-2xl">
            Tu refugio personal para la reflexión.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="w-full max-w-md"
        >
          {isLogged ? (
            <Link
              href="/chat"
              className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-primary px-8 py-4 text-lg font-medium text-on-primary shadow-lg transition-transform hover:scale-105 active:scale-95"
            >
              <span className="absolute inset-0 bg-white/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <span className="relative z-10 flex items-center gap-2 transition-colors">
                Continuar a mi SentIA
                <ArrowRight className="h-5 w-5" />
              </span>
            </Link>
          ) : (
            <div className="rounded-3xl border border-outline/10 bg-surface/80 p-6 shadow-xl backdrop-blur-xl">
              <AnimatePresence mode="wait">
                {status === "sent" && !isLogin ? (
                  <motion.div
                    key="sent"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="py-4 text-center"
                  >
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
                      <Mail className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-semibold text-on-surface">Revisa tu correo</h3>
                    <p className="mt-2 text-sm text-on-surface-variant">
                      Te hemos enviado un enlace para confirmar tu registro.
                    </p>
                    <button
                      onClick={() => { setStatus("idle"); setIsLogin(true); }}
                      className="mt-6 text-sm font-bold text-primary hover:brightness-110"
                    >
                      Volver a Iniciar Sesión
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="login"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                  >
                    <form onSubmit={handleAuth} className="space-y-4">
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-on-surface-variant/50" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Tu correo electrónico"
                          className="h-14 w-full rounded-2xl border border-outline/20 bg-surface-container pl-12 pr-4 text-sm outline-none ring-primary/20 transition-all focus:border-primary focus:bg-surface focus:ring-4 text-on-surface placeholder:text-on-surface-variant/50"
                        />
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-on-surface-variant/50" />
                        <input
                          type="password"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Contraseña"
                          className="h-14 w-full rounded-2xl border border-outline/20 bg-surface-container pl-12 pr-4 text-sm outline-none ring-primary/20 transition-all focus:border-primary focus:bg-surface focus:ring-4 text-on-surface placeholder:text-on-surface-variant/50"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={status === "loading"}
                        className="group relative flex h-14 w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-primary font-bold text-on-primary shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                      >
                        {status === "loading" ? "Cargando..." : isLogin ? "Iniciar Sesión" : "Crear cuenta"}
                        <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                      </button>
                    </form>

                    <div className="mt-4 text-center">
                      <button
                        type="button"
                        onClick={() => { setIsLogin(!isLogin); setErrorMessage(null); setStatus("idle"); }}
                        className="text-sm font-medium text-on-surface-variant hover:text-primary transition-colors"
                      >
                        {isLogin ? "¿No tienes cuenta? Regístrate aquí" : "¿Ya tienes cuenta? Inicia sesión"}
                      </button>
                    </div>

                    <div className="my-6 flex items-center gap-4 text-outline/40">
                      <div className="h-px flex-1 bg-outline/20" />
                      <span className="text-[10px] uppercase tracking-widest font-bold">o</span>
                      <div className="h-px flex-1 bg-outline/20" />
                    </div>

                    <Link
                      href="/chat"
                      className="flex w-full items-center justify-center gap-2 text-sm font-medium text-on-surface-variant hover:text-primary"
                    >
                      <UserCircle2 className="h-5 w-5" />
                      Continuar como invitado
                    </Link>

                    {errorMessage && (
                      <p className="mt-4 text-xs font-bold text-error text-center">
                        {errorMessage.includes("Invalid login credentials")
                          ? "Credenciales incorrectas."
                          : errorMessage.includes("User already registered")
                            ? "El usuario ya está registrado."
                            : errorMessage}
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-16 text-xs font-medium text-on-surface-variant/60"
        >
          Al iniciar sesión, SentIA podrá recordarte, saludarte por tu nombre y guardar todo tu progreso emocional.
        </motion.p>
      </main>
    </div>
  );
}

