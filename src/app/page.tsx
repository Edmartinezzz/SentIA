"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Sparkles, MessageCircleHeart, BookOpen, Target, TrendingUp, Music, Shield, ArrowRight, Check, Brain, Heart, Star, Mail, Lock, UserCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

const features = [
  {
    icon: MessageCircleHeart,
    title: "Chat Empático con IA",
    description: "Habla con SentIA cuando lo necesites. Escucha activa, sin juicios, disponible 24/7.",
    color: "from-violet-500 to-purple-600"
  },
  {
    icon: BookOpen,
    title: "Diario Cognitivo",
    description: "Registra tus pensamientos y detecta patrones con técnicas de Terapia Cognitivo-Conductual.",
    color: "from-blue-500 to-cyan-500"
  },
  {
    icon: Target,
    title: "Misiones Diarias",
    description: "Pequeños retos que construyen grandes hábitos. Ganamifica tu bienestar.",
    color: "from-emerald-500 to-green-500"
  },
  {
    icon: TrendingUp,
    title: "Seguimiento de Progreso",
    description: "Visualiza tu evolución emocional en el tiempo con reportes y gráficas.",
    color: "from-orange-500 to-amber-500"
  },
  {
    icon: Music,
    title: "Sonidos Relajantes",
    description: "Lluvia, bosque, mar y más. Ambientes sonoros para calmar tu mente.",
    color: "from-pink-500 to-rose-500"
  },
  {
    icon: Brain,
    title: "IA Avanzada",
    description: "Impulsada por los modelos de lenguaje más avanzados del mundo. Respuestas reales.",
    color: "from-indigo-500 to-violet-500"
  }
];

const testimonials = [
  { text: "Desde que uso SentIA me siento más en control de mis emociones.", name: "Andrea M.", role: "Estudiante universitaria" },
  { text: "El diario cognitivo cambió completamente cómo proceso mis pensamientos.", name: "Luis R.", role: "Profesional en marketing" },
  { text: "Las misiones diarias me ayudaron a crear hábitos que nunca pude sostener antes.", name: "María C.", role: "Emprendedora" }
];

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
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        window.location.href = "/chat";
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/chat" },
        });
        if (error) throw error;
        if (data?.user?.identities?.length === 0) {
          setErrorMessage("Este correo ya está registrado. Intenta iniciar sesión.");
          setStatus("error");
          return;
        }
        setStatus("sent");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Algo salió mal. Intenta de nuevo.");
      setStatus("error");
    }
  };

  const featuresRef = useRef(null);
  const featuresInView = useInView(featuresRef, { once: true, amount: 0.2 });

  return (
    <div className="min-h-screen bg-[#07080d] text-white overflow-x-hidden">

      {/* ── NAV ── */}
      <nav className="fixed top-0 w-full z-50 bg-[#07080d]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-lg shadow-violet-500/25">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-black tracking-tight bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">SentIA</span>
          </div>
          <div className="flex items-center gap-4">
            {isLogged ? (
              <a href="/chat" className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold text-sm hover:brightness-110 transition-all shadow-lg shadow-violet-500/20">
                Ir a mi app <ArrowRight className="h-4 w-4" />
              </a>
            ) : (
              <>
                <button onClick={() => setIsLogin(true)} className="text-sm font-semibold text-white/60 hover:text-white transition-colors">Iniciar sesión</button>
                <a href="#acceso" className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold text-sm hover:brightness-110 transition-all shadow-lg shadow-violet-500/20">
                  Empezar gratis
                </a>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative pt-36 pb-28 px-6">
        {/* Glow backgrounds */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full bg-violet-600/10 blur-[120px]" />
          <div className="absolute top-40 left-1/4 w-[300px] h-[300px] rounded-full bg-purple-500/10 blur-[80px]" />
          <div className="absolute top-40 right-1/4 w-[300px] h-[300px] rounded-full bg-indigo-500/10 blur-[80px]" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 mb-8"
          >
            <Heart className="h-3.5 w-3.5 text-violet-400" />
            <span className="text-xs font-semibold text-violet-300 uppercase tracking-widest">Bienestar emocional con IA</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-6xl md:text-7xl font-black leading-[1.05] tracking-tight mb-6"
          >
            Tu espacio seguro
            <br />
            <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">para crecer emocionalmente</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-xl text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            SentIA es tu asistente de bienestar mental potenciado por inteligencia artificial.
            Chatea, reflexiona, establece hábitos y haz seguimiento de tu progreso emocional.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <a href="#acceso" className="flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold text-lg hover:brightness-110 active:scale-95 transition-all shadow-xl shadow-violet-500/25">
              Comenzar gratis <ArrowRight className="h-5 w-5" />
            </a>
            <span className="text-sm text-white/30 font-medium flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-400" /> Sin tarjeta de crédito
            </span>
          </motion.div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section ref={featuresRef} className="py-24 px-6 bg-white/[0.02]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">Todo lo que necesitas</h2>
            <p className="text-white/40 text-lg">Herramientas basadas en psicología real para mejorar tu día a día.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feat, i) => {
              const Icon = feat.icon;
              return (
                <motion.div
                  key={feat.title}
                  initial={{ opacity: 0, y: 30 }}
                  animate={featuresInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className="group p-6 rounded-3xl bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.07] transition-all duration-300"
                >
                  <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${feat.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold mb-2 text-white">{feat.title}</h3>
                  <p className="text-white/40 text-sm leading-relaxed">{feat.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4 tracking-tight">Lo que dicen las personas</h2>
            <p className="text-white/40">Miles de usuarios ya mejoran su bienestar con SentIA.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.15 }}
                viewport={{ once: true }}
                className="p-6 rounded-3xl bg-white/[0.04] border border-white/[0.06]"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-white/70 text-sm leading-relaxed mb-5 italic">"{t.text}"</p>
                <div>
                  <p className="font-bold text-sm text-white">{t.name}</p>
                  <p className="text-xs text-white/30">{t.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AUTH / CTA ── */}
      <section id="acceso" className="py-24 px-6">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-4xl font-black mb-3 tracking-tight">
              {isLogin ? "Bienvenido de vuelta" : "Empieza hoy, gratis"}
            </h2>
            <p className="text-white/40">
              {isLogin ? "Accede a tu espacio de bienestar" : "Sin tarjeta de crédito. Sin compromisos."}
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-white/[0.05] border border-white/[0.08] backdrop-blur-sm">
            {status === "sent" ? (
              <div className="text-center py-8">
                <div className="h-16 w-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-5">
                  <Check className="h-8 w-8 text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold mb-2">¡Revisa tu correo!</h3>
                <p className="text-white/40 text-sm">Te enviamos un link de confirmación. Activa tu cuenta para comenzar.</p>
              </div>
            ) : (
              <>
                <div className="flex p-1 bg-white/[0.05] rounded-2xl mb-6">
                  <button onClick={() => setIsLogin(true)} className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${isLogin ? "bg-violet-600 text-white shadow" : "text-white/40 hover:text-white"}`}>Iniciar sesión</button>
                  <button onClick={() => setIsLogin(false)} className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${!isLogin ? "bg-violet-600 text-white shadow" : "text-white/40 hover:text-white"}`}>Crear cuenta</button>
                </div>

                <form onSubmit={handleAuth} className="space-y-4">
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                    <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@correo.com" className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white/[0.06] border border-white/[0.08] text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-violet-500/50 text-sm" />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                    <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="Contraseña" className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white/[0.06] border border-white/[0.08] text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-violet-500/50 text-sm" />
                  </div>

                  {errorMessage && <p className="text-rose-400 text-xs text-center bg-rose-500/10 px-4 py-2 rounded-xl">{errorMessage}</p>}

                  <button type="submit" disabled={status === "loading"} className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold text-sm hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-violet-500/25 disabled:opacity-50">
                    {status === "loading" ? "Cargando..." : isLogin ? "Entrar a SentIA" : "Crear mi cuenta"}
                  </button>
                </form>

                <p className="text-center text-xs text-white/20 mt-5">
                  Al continuar aceptas que SentIA es un apoyo emocional y no reemplaza atención psicológica profesional.
                </p>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-12 px-6 border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="font-black bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">SentIA</span>
          </div>
          <p className="text-white/20 text-sm">© 2026 SentIA · Tu bienestar mental es nuestra prioridad.</p>
          <div className="flex gap-6 text-sm text-white/30">
            <span>Apoyo emocional con IA</span>
            <span>·</span>
            <span>No reemplaza terapia profesional</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
