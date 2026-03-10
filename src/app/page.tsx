"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Sparkles, MessageCircleHeart, BookOpen, Target, TrendingUp, Music, ArrowRight, Check, Brain, Heart, Star } from "lucide-react";
import { supabase } from "@/lib/supabase";

const features = [
  {
    icon: MessageCircleHeart,
    title: "Chat Empático con IA",
    description: "Habla con SentIA cuando lo necesites. Escucha activa, sin juicios, disponible 24/7.",
    color: "from-teal-500 to-cyan-600"
  },
  {
    icon: BookOpen,
    title: "Diario Cognitivo",
    description: "Registra tus pensamientos y detecta patrones con técnicas de Terapia Cognitivo-Conductual.",
    color: "from-cyan-500 to-blue-500"
  },
  {
    icon: Target,
    title: "Misiones Diarias",
    description: "Pequeños retos que construyen grandes hábitos. Gamifica tu bienestar.",
    color: "from-emerald-500 to-teal-500"
  },
  {
    icon: TrendingUp,
    title: "Seguimiento de Progreso",
    description: "Visualiza tu evolución emocional en el tiempo con reportes y gráficas.",
    color: "from-teal-600 to-emerald-600"
  },
  {
    icon: Music,
    title: "Sonidos Relajantes",
    description: "Lluvia, bosque, mar y más. Ambientes sonoros para calmar tu mente.",
    color: "from-emerald-400 to-cyan-500"
  },
  {
    icon: Brain,
    title: "IA Avanzada",
    description: "Impulsada por los modelos de lenguaje más avanzados del mundo. Respuestas reales.",
    color: "from-teal-700 to-cyan-700"
  }
];

const testimonials = [
  { text: "Desde que uso SentIA me siento más en control de mis emociones.", name: "Andrea M.", role: "Estudiante universitaria" },
  { text: "El diario cognitivo cambió completamente cómo proceso mis pensamientos.", name: "Luis R.", role: "Profesional en marketing" },
  { text: "Las misiones diarias me ayudaron a crear hábitos que nunca pude sostener antes.", name: "María C.", role: "Emprendedora" }
];

export default function Home() {
  const [isLogged, setIsLogged] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLogged(!!session);
    };
    checkUser();
  }, []);

  const featuresRef = useRef(null);
  const featuresInView = useInView(featuresRef, { once: true, amount: 0.2 });

  return (
    <div className="min-h-screen bg-[#070b0b] text-white overflow-x-hidden">

      {/* ── NAV ── */}
      <nav className="fixed top-0 w-full z-50 bg-[#070b0b]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-[#008B8B] flex items-center justify-center shadow-lg shadow-primary/25">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-black tracking-tight bg-gradient-to-r from-primary to-[#008B8B] bg-clip-text text-transparent">SentIA</span>
          </div>
          <div className="flex items-center gap-4">
            {isLogged ? (
              <a href="/chat" className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-primary to-[#008B8B] text-white font-bold text-sm hover:brightness-110 transition-all shadow-lg shadow-primary/20">
                Ir a mi app <ArrowRight className="h-4 w-4" />
              </a>
            ) : (
              <a href="/login" className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-primary to-[#008B8B] text-white font-bold text-sm hover:brightness-110 transition-all shadow-lg shadow-primary/20">
                Entrar
              </a>
            )}
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative pt-36 pb-28 px-6">
        {/* Glow backgrounds (Verdes/Cian) */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full bg-primary/10 blur-[120px]" />
          <div className="absolute top-40 left-1/4 w-[300px] h-[300px] rounded-full bg-emerald-500/10 blur-[80px]" />
          <div className="absolute top-40 right-1/4 w-[300px] h-[300px] rounded-full bg-cyan-500/10 blur-[80px]" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-8"
          >
            <Heart className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-semibold text-primary uppercase tracking-widest leading-none">Bienestar emocional con IA</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-6xl md:text-7xl font-black leading-[1.05] tracking-tight mb-6"
          >
            Tu espacio seguro
            <br />
            <span className="bg-gradient-to-r from-primary via-emerald-400 to-cyan-400 bg-clip-text text-transparent italic">para la claridad mental</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-xl text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed font-medium"
          >
            SentIA es tu compañero de Inteligencia Artificial diseñado para ayudarte a navegar tus emociones,
            construir hábitos positivos y encontrar paz interior en tu día a día.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <a href="/login" className="group flex items-center gap-3 px-10 py-5 rounded-full bg-gradient-to-r from-primary to-[#008B8B] text-on-primary font-black text-xl hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-primary/30">
              Comencemos <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-12 flex items-center justify-center gap-6 text-white/30"
          >
            <span className="text-sm font-bold flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> 100% Gratuito</span>
            <span className="text-sm font-bold flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Privado y Seguro</span>
          </motion.div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section ref={featuresRef} className="py-24 px-6 bg-white/[0.02] border-y border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">Todo lo que necesitas</h2>
            <p className="text-white/40 text-lg font-medium">Herramientas inteligentes para una mente más tranquila.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feat, i) => {
              const Icon = feat.icon;
              return (
                <motion.div
                  key={feat.title}
                  initial={{ opacity: 0, y: 30 }}
                  animate={featuresInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className="group p-8 rounded-[32px] bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.06] hover:border-primary/20 transition-all duration-300"
                >
                  <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${feat.color} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-white tracking-tight">{feat.title}</h3>
                  <p className="text-white/40 text-[15px] leading-relaxed font-medium">{feat.description}</p>
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
            <h2 className="text-4xl font-black mb-4 tracking-tight">El impacto de SentIA</h2>
            <p className="text-white/40 font-medium">La salud mental es el pilar de una vida plena.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.15 }}
                viewport={{ once: true }}
                className="p-8 rounded-[32px] bg-white/[0.03] border border-white/[0.05] flex flex-col justify-between"
              >
                <div>
                  <div className="flex gap-1 mb-5">
                    {[...Array(5)].map((_, j) => <Star key={j} className="h-4 w-4 fill-primary text-primary" />)}
                  </div>
                  <p className="text-white/70 text-[15px] leading-relaxed mb-6 font-medium italic">"{t.text}"</p>
                </div>
                <div>
                  <p className="font-bold text-white">{t.name}</p>
                  <p className="text-xs text-primary/60 font-bold uppercase tracking-widest mt-1">{t.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">Comienza tu viaje hoy</h2>
          <p className="text-white/50 text-xl mb-10 font-medium leading-relaxed">
            Únete a cientos de personas que ya utilizan la tecnología para entender mejor su mundo interior.
          </p>
          <a href="/login" className="inline-flex items-center gap-3 px-10 py-5 rounded-full bg-white text-black font-black text-xl hover:scale-105 active:scale-95 transition-all shadow-2xl">
            Probar SentIA Gratis <ArrowRight className="h-6 w-6" />
          </a>
          <p className="mt-6 text-sm text-white/20 font-bold">No requiere tarjeta de crédito · Acceso instantáneo</p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-12 px-6 border-t border-white/[0.06] bg-[#050808]">
        <div className="max-w-6xl mx-auto border-b border-white/5 pb-12 mb-12 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-[#008B8B] flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-black bg-gradient-to-r from-primary to-[#008B8B] bg-clip-text text-transparent">SentIA</span>
          </div>
          <div className="flex gap-8 text-sm font-bold text-white/40 italic">
            <span>#SaludMental</span>
            <span>#IA</span>
            <span>#Bienestar</span>
          </div>
        </div>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-white/20 text-xs font-bold uppercase tracking-widest leading-none">© 2026 SentIA · Todos los derechos reservados.</p>
          <div className="flex gap-6 text-[10px] uppercase font-black tracking-[0.2em] text-white/30">
            <span>Asistente de Apoyo IA</span>
            <span>·</span>
            <span>Uso Personal No Terapéutico</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
