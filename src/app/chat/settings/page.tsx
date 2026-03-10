"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { SlidersHorizontal, Moon, SunMedium, HeartHandshake, Check } from "lucide-react";

export default function SettingsPage() {
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  const [briefResponses, setBriefResponses] = useState(true);
  const [actionFocus, setActionFocus] = useState(true);

  // Cargar preferencias
  useEffect(() => {
    const savedTheme = localStorage.getItem("clarity_theme") as any;
    const savedBrief = localStorage.getItem("clarity_brief_responses");
    const savedAction = localStorage.getItem("clarity_action_focus");

    if (savedTheme) setTheme(savedTheme);
    if (savedBrief) setBriefResponses(savedBrief === "true");
    if (savedAction) setActionFocus(savedAction === "true");
  }, []);

  // Aplicar tema
  useEffect(() => {
    const element = document.documentElement;
    if (theme === "dark") {
      element.classList.add("dark");
    } else if (theme === "light") {
      element.classList.remove("dark");
    } else {
      // System
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        element.classList.add("dark");
      } else {
        element.classList.remove("dark");
      }
    }
    localStorage.setItem("clarity_theme", theme);
  }, [theme]);

  const toggleBrief = (val: boolean) => {
    setBriefResponses(val);
    localStorage.setItem("clarity_brief_responses", String(val));
  };

  const toggleAction = (val: boolean) => {
    setActionFocus(val);
    localStorage.setItem("clarity_action_focus", String(val));
  };
  return (
    <div className="flex h-full flex-col gap-10 bg-background px-4 py-8 text-on-surface md:px-10 overflow-y-auto scrollbar-hide">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-primary">
            Configuración suave
          </h1>
          <p className="mt-2 text-[16px] text-on-surface-variant font-medium max-w-2xl">
            Ajusta pequeños detalles de cómo Clarity te acompaña. Siempre de
            forma calmada y respetuosa.
          </p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid gap-8 md:grid-cols-2 lg:max-w-6xl pb-10"
      >
        <section className="space-y-6 rounded-[32px] bg-surface-container p-8 shadow-sm border border-outline/5 overflow-hidden relative group">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-primary-container text-primary">
              <SlidersHorizontal className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-on-surface">Tono y estilo</h2>
              <p className="text-[13px] text-on-surface-variant font-medium">
                Personaliza la forma en que Clarity interactúa contigo.
              </p>
            </div>
          </div>

          <div className="space-y-4 text-sm mt-4">
            <div className="flex items-center justify-between gap-4 rounded-3xl bg-surface-container-high px-6 py-5 border border-outline/5">
              <span className="text-[15px] font-bold text-on-surface">Respuestas más breves</span>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={briefResponses}
                  onChange={(e) => toggleBrief(e.target.checked)}
                />
                <div className="peer h-7 w-12 rounded-full bg-outline/30 transition peer-checked:bg-primary" />
                <span className="absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-all peer-checked:translate-x-5" />
              </label>
            </div>

            <div className="flex items-center justify-between gap-4 rounded-3xl bg-surface-container-high px-6 py-5 border border-outline/5">
              <span className="text-[15px] font-bold text-on-surface">Más foco en acciones</span>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={actionFocus}
                  onChange={(e) => toggleAction(e.target.checked)}
                />
                <div className="peer h-7 w-12 rounded-full bg-outline/30 transition peer-checked:bg-primary" />
                <span className="absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-all peer-checked:translate-x-5" />
              </label>
            </div>

            <div className="flex items-center justify-between gap-4 rounded-3xl bg-surface-container-low/50 px-6 py-5 border border-outline/5 italic">
              <span className="text-[15px] font-medium text-on-surface-variant opacity-60">Recordar que no es terapia</span>
              <div className="flex items-center gap-2 text-primary">
                <Check className="h-5 w-5" />
                <span className="text-[11px] font-bold uppercase tracking-widest">Siempre activo</span>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-6 rounded-[32px] bg-surface-container p-8 shadow-sm border border-outline/5 overflow-hidden relative group">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-secondary-container text-secondary">
              <HeartHandshake className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-on-surface">Apariencia</h2>
              <p className="text-[13px] text-on-surface-variant font-medium">
                Ajusta cómo se ve Clarity según tu comodidad visual.
              </p>
            </div>
          </div>

          <div className="space-y-3 mt-4">
            <button
              onClick={() => setTheme("light")}
              className={`flex w-full items-center justify-between gap-4 rounded-2xl px-6 py-4 transition-all ${theme === "light" ? "bg-primary-container text-primary shadow-sm" : "bg-surface-container-high text-on-surface-variant hover:bg-surface-variant/30"}`}
            >
              <div className="flex items-center gap-3">
                <SunMedium className="h-5 w-5" />
                <span className="text-[15px] font-bold">Modo claro</span>
              </div>
              {theme === "light" && <Check className="h-5 w-5" />}
            </button>

            <button
              onClick={() => setTheme("dark")}
              className={`flex w-full items-center justify-between gap-4 rounded-2xl px-6 py-4 transition-all ${theme === "dark" ? "bg-primary-container text-primary shadow-sm" : "bg-surface-container-high text-on-surface-variant hover:bg-surface-variant/30"}`}
            >
              <div className="flex items-center gap-3">
                <Moon className="h-5 w-5" />
                <span className="text-[15px] font-bold">Modo oscuro</span>
              </div>
              {theme === "dark" && <Check className="h-5 w-5" />}
            </button>

            <button
              onClick={() => setTheme("system")}
              className={`flex w-full items-center justify-between gap-4 rounded-2xl px-6 py-4 transition-all ${theme === "system" ? "bg-primary-container text-primary shadow-sm" : "bg-surface-container-high text-on-surface-variant hover:bg-surface-variant/30"}`}
            >
              <div className="flex items-center gap-3">
                <SlidersHorizontal className="h-5 w-5" />
                <span className="text-[15px] font-bold">Sincronizar con el sistema</span>
              </div>
              {theme === "system" && <Check className="h-5 w-5" />}
            </button>
          </div>
        </section>
      </motion.div>
    </div>
  );
}

