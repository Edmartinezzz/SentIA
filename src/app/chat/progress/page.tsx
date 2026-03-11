"use client";

import { useEffect, useState } from "react";
import { getApiUrl } from "@/lib/api-utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  HeartPulse,
  LineChart,
  CalendarRange,
  CheckCircle2,
  Circle,
  RefreshCw,
  Utensils,
  Zap,
  Trophy,
  Star,
  Award,
  X,
  Wind,
  Sparkles,
  FileText,
  Download
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import dynamic from "next/dynamic";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// Dynamic Imports para Code Splitting (Optimización de Rendimiento)
const MoodCalendar = dynamic(() => import("@/components/MoodCalendar"), { ssr: false });
const WellnessGoals = dynamic(() => import("@/components/WellnessGoals"), { ssr: false });
const SleepTracker = dynamic(() => import("@/components/SleepTracker"), { ssr: false });
const EmotionDashboard = dynamic(() => import("@/components/EmotionDashboard"), { ssr: false });


type DayData = {
  day: string;
  mood: string;
  intensity: number;
};

type Recommendation = {
  id: string;
  content: string;
  category: "activity" | "food";
  completed: boolean;
};

type Badge = {
  type: string;
  name: string;
  icon: any;
  color: string;
};

type WeeklyReport = {
  id: string;
  start_date: string;
  end_date: string;
  dominant_mood: string;
  summary: string;
  key_insights: string[];
};

const BADGES: Badge[] = [
  { type: "resilience", name: "Resiliencia de Acero", icon: Zap, color: "text-amber-500 bg-amber-100" },
  { type: "calm", name: "Maestro de la Calma", icon: Wind, color: "text-blue-500 bg-blue-100" },
  { type: "self_care", name: "Guardián del Bienestar", icon: HeartPulse, color: "text-rose-500 bg-rose-100" },
  { type: "SentIA", name: "Mente de Cristal", icon: Star, color: "text-violet-500 bg-violet-100" },
  { type: "discipline", name: "Hábito de Oro", icon: Award, color: "text-emerald-500 bg-emerald-100" },
];

export default function ProgressPage() {
  const [weeklyData, setWeeklyData] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalMessages, setTotalMessages] = useState(0);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [currentBadge, setCurrentBadge] = useState<{ name: string; message: string; icon: any } | null>(null);
  const [isFinishing, setIsFinishing] = useState(false);
  const [emotionLogs, setEmotionLogs] = useState<any[]>([]);

  // Reporte Semanal
  const [weeklyReport, setWeeklyReport] = useState<WeeklyReport | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const fetchProgress = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        // MODO INVITADO
        const storedRecs = window.localStorage.getItem("SentIA_guest_recs");
        if (storedRecs) {
          setRecommendations(JSON.parse(storedRecs));
        }

        const storedStats = window.localStorage.getItem("SentIA_conversations");
        if (storedStats) {
          const guestConvs = JSON.parse(storedStats);
          processMessagesForStats(guestConvs.flatMap((c: any) => c.messages || []));
        }

        // Cargar ánimos de invitado
        const storedMoods = window.localStorage.getItem("SentIA_guest_moods");
        if (storedMoods) {
          setEmotionLogs(JSON.parse(storedMoods));
        }

        setLoading(false);
        return;
      }

      const uid = session.user.id;
      setUserId(uid);

      // SINCRONIZACIÓN
      await syncGuestProgress(uid);

      // 1. Cargar estadísticas de mensajes
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: messages, error } = await supabase
        .from("messages")
        .select("created_at, conversations!inner(user_id)")
        .eq("conversations.user_id", uid)
        .gte("created_at", sevenDaysAgo.toISOString());

      if (!error && messages) {
        processMessagesForStats(messages);
      }

      if (uid) {
        await fetchEmotionLogs(uid);
      }

      // 2. Cargar recomendaciones
      await loadRecommendations(uid);

      // 3. Cargar reporte semanal (el más reciente)
      const { data: report, error: repError } = await supabase
        .from("weekly_reports")
        .select("*")
        .eq("user_id", uid)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!repError && report) setWeeklyReport(report as WeeklyReport);
      else if (repError) console.warn("Supabase Error (weekly_reports):", repError.message);

      setLoading(false);
    };

    fetchProgress();
  }, []);

  const fetchEmotionLogs = async (uid: string) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: emotions, error: emoError } = await supabase
      .from("emotion_logs")
      .select("*")
      .eq("user_id", uid)
      .gte("created_at", thirtyDaysAgo.toISOString())
      .order("created_at", { ascending: false });

    if (!emoError && emotions) {
      setEmotionLogs(emotions);
    } else if (emoError) {
      console.error("❌ Supabase Error (emotion_logs):", emoError.message);
    }
  };

  const processMessagesForStats = (messages: any[]) => {
    setTotalMessages(messages.length);
    const days = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
    const counts: Record<string, number> = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      counts[days[d.getDay()]] = 0;
    }
    messages.forEach(m => {
      const dayName = days[new Date(m.created_at).getDay()];
      if (counts[dayName] !== undefined) counts[dayName]++;
    });
    const formattedData = Object.entries(counts).map(([day, count]) => ({
      day,
      mood: count > 3 ? "Activo" : "Calma",
      intensity: Math.min(count, 10)
    })).reverse();
    setWeeklyData(formattedData);
  };

  const syncGuestProgress = async (uid: string) => {
    const stored = window.localStorage.getItem("SentIA_guest_recs");
    if (!stored) return;

    try {
      const guestRecs: Recommendation[] = JSON.parse(stored);
      if (guestRecs.length === 0) return;

      const { count } = await supabase
        .from("progress_recommendations")
        .select('*', { count: 'exact', head: true })
        .eq("user_id", uid);

      if (count === 0) {
        const toInsert = guestRecs.map(r => ({
          user_id: uid,
          content: r.content,
          category: r.category,
          completed: r.completed
        }));
        await supabase.from("progress_recommendations").insert(toInsert);
      }

      window.localStorage.removeItem("SentIA_guest_recs");
    } catch (e) {
      console.error("Error syncing progress:", e);
    }
  };

  const getMoodColor = (mood: string) => {
    switch (mood) {
      case 'joy': return 'bg-amber-400';
      case 'sadness': return 'bg-blue-400';
      case 'anxiety': return 'bg-violet-400';
      case 'anger': return 'bg-rose-400';
      case 'calm': return 'bg-emerald-400';
      default: return 'bg-slate-400';
    }
  };

  const getMoodLabel = (mood: string) => {
    switch (mood) {
      case 'joy': return 'Alegría';
      case 'sadness': return 'Tristeza';
      case 'anxiety': return 'Ansiedad';
      case 'anger': return 'Enojo';
      case 'calm': return 'Calma';
      default: return mood;
    }
  };

  const loadRecommendations = async (uid: string) => {
    const { data: recs, error } = await supabase
      .from("progress_recommendations")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false })
      .limit(20); // Tomamos suficientes para filtrar

    if (!error && recs && recs.length > 0) {
      // Filtrar para mostrar solo las últimas 3 de cada categoría
      const latestActivities = recs.filter(r => r.category === "activity").slice(0, 3);
      const latestFood = recs.filter(r => r.category === "food").slice(0, 3);
      setRecommendations([...latestActivities, ...latestFood]);
    } else if (error) {
      console.warn("Supabase Error (progress_recommendations):", error.message);
    } else if (recs?.length === 0) {
      handleGenerateRecommendations();
    }
  };

  const handleGenerateRecommendations = async () => {
    setIsGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) return;

      const resp = await fetch(getApiUrl("/api/progress/generate"), {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
          "Content-Type": "application/json"
        }
      });

      if (!resp.ok) {
        const errorText = await resp.text();
        console.error("API Error Response (HTML?):", errorText);
        throw new Error(`Server returned ${resp.status}`);
      }

      const data = await resp.json();
      if (data.recommendations) {
        setRecommendations(data.recommendations);
        if (data.error) console.warn("Plan generated with fallback:", data.error);
      }
    } catch (err) {
      console.error("Error generating recommendations:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportPDF = async () => {
    const element = document.getElementById("progress-content");
    if (!element) return;

    setIsExporting(true);
    try {
      // Ocultar botones de acción temporalmente para la captura
      const actionButtons = document.querySelectorAll(".no-pdf");
      actionButtons.forEach((btn: any) => (btn.style.display = "none"));

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: null,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`SentIA_Reporte_${new Date().toISOString().split("T")[0]}.pdf`);

      // Mostrar botones de acción de nuevo
      actionButtons.forEach((btn: any) => (btn.style.display = "flex"));
    } catch (error) {
      console.error("Error exporting PDF:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleGenerateWeeklyReport = async () => {
    setIsGeneratingReport(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const resp = await fetch(getApiUrl("/api/reports/generate"), {
        method: "POST",
        headers: { "Authorization": `Bearer ${session.access_token}` }
      });

      const data = await resp.json();
      if (data.success && data.report) {
        setWeeklyReport(data.report);
      } else if (data.message) {
        alert(data.message); // Mostrar al usuario que faltan datos
      }
    } catch (err) {
      console.error("Error generando reporte:", err);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleFinishDay = async () => {
    if (!userId) return;
    setIsFinishing(true);

    const randomBadge = BADGES[Math.floor(Math.random() * BADGES.length)];
    const reflectiveMessages = [
      "Cada pequeño paso cuenta. Hoy has demostrado que tu bienestar es una prioridad.",
      "La claridad mental no es un destino, sino un camino que hoy has recorrido con éxito.",
      "Cuidar de ti mismo es el acto más valiente que puedes realizar. ¡Felicidades!",
      "Tu constancia es la base de tu transformación. Sigue brillando.",
      "Has logrado silenciar el ruido para escuchar tus propias necesidades. Gran trabajo."
    ];
    const message = reflectiveMessages[Math.floor(Math.random() * reflectiveMessages.length)];

    try {
      const { error } = await supabase.from("user_badges").insert({
        user_id: userId,
        badge_type: randomBadge.type,
        badge_name: randomBadge.name,
        reflective_message: message
      });

      if (error) throw error;

      const confetti = (await import("canvas-confetti")).default;

      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#8b5cf6', '#3b82f6', '#10b981']
      });

      // Iniciar generación en segundo plano
      handleGenerateRecommendations();

      setCurrentBadge({ name: randomBadge.name, message: message, icon: randomBadge.icon });
      setShowBadgeModal(true);

    } catch (err) {
      console.error("Error al finalizar día:", err);
    } finally {
      setIsFinishing(false);
    }
  };

  const toggleComplete = async (id: string, currentStatus: boolean) => {
    if (!userId) {
      const updated = recommendations.map(r => r.id === id ? { ...r, completed: !currentStatus } : r);
      setRecommendations(updated);
      window.localStorage.setItem("SentIA_guest_recs", JSON.stringify(updated));
      return;
    }

    const { error } = await supabase
      .from("progress_recommendations")
      .update({ completed: !currentStatus })
      .eq("id", id);

    if (!error) {
      setRecommendations(prev =>
        prev.map(r => r.id === id ? { ...r, completed: !currentStatus } : r)
      );
    }
  };

  const completedCount = recommendations.filter(r => r.completed).length;
  const progressPercent = recommendations.length > 0
    ? Math.round((completedCount / recommendations.length) * 100)
    : 0;

  if (!isMounted) return null;

  return (
    <div id="progress-content" className="flex h-full flex-col gap-8 bg-background px-4 py-8 md:px-10 overflow-y-auto scrollbar-hide relative z-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-on-surface">
            Tu Progreso de Bienestar
          </h1>
          <p className="mt-2 text-lg text-on-surface-variant font-medium">
            Visualiza tu evolución emocional y recomendaciones personalizadas.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleExportPDF}
            disabled={isExporting}
            className="no-pdf flex items-center gap-3 rounded-full bg-surface-variant px-6 py-3.5 text-sm font-bold text-on-surface-variant transition-all disabled:opacity-50"
          >
            {isExporting ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
            Exportar PDF
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGenerateRecommendations}
            disabled={isGenerating}
            className="flex items-center gap-3 rounded-full bg-primary px-6 py-3.5 text-sm font-bold text-on-primary transition-all disabled:opacity-50"
          >
            <RefreshCw className={`h-5 w-5 ${isGenerating ? 'animate-spin' : ''}`} />
            Actualizar Plan
          </motion.button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Columna Principal */}
        <div className="lg:col-span-2 space-y-8">

          {/* Barra de Progreso General */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[32px] bg-primary-container p-10 shadow-sm relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-8 relative z-10">
              <div className="flex items-center gap-5">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-on-primary shadow-lg">
                  <Zap className="h-8 w-8" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-on-primary-container">Meta de Hoy</h2>
                  <p className="text-on-primary-container/70 font-medium">Lleva tu bienestar al siguiente nivel.</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <span className="text-5xl font-black text-primary drop-shadow-sm">{progressPercent}%</span>
                <AnimatePresence>
                  {progressPercent === 100 && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      onClick={handleFinishDay}
                      className="flex items-center gap-3 rounded-full bg-primary px-8 py-4 text-sm font-bold text-on-primary shadow-lg hover:brightness-110 transition-all"
                    >
                      <Trophy className="h-5 w-5" />
                      Finalizar Día
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </div>
            <div className="relative h-4 w-full overflow-hidden rounded-full bg-on-primary-container/10">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                className="h-full bg-primary"
              />
            </div>
          </motion.div>

          {/* Listas de Tareas */}
          <div className="grid gap-8 md:grid-cols-2">
            {/* Actividades */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 px-2 text-primary">
                <HeartPulse className="h-5 w-5" />
                <h3 className="text-sm font-bold uppercase tracking-widest">Actividades</h3>
              </div>
              <div className="space-y-3">
                {recommendations.filter(r => r.category === "activity").map((rec) => (
                  <motion.div
                    layout
                    key={rec.id}
                    onClick={() => toggleComplete(rec.id, rec.completed)}
                    className={`group rounded-3xl p-5 transition-all cursor-pointer border ${rec.completed
                      ? 'bg-surface-variant opacity-60 border-transparent'
                      : 'bg-surface-container border-outline/10 hover:border-primary/50'
                      }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all ${rec.completed ? 'bg-primary border-primary text-on-primary' : 'border-outline'}`}>
                        {rec.completed && <CheckCircle2 className="h-4 w-4" />}
                      </div>
                      <p className={`text-[17px] leading-snug font-bold ${rec.completed ? 'text-on-surface-variant line-through' : 'text-on-surface'}`}>
                        {rec.content}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>

            {/* Nutrición */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 px-2 text-secondary">
                <Utensils className="h-5 w-5" />
                <h3 className="text-sm font-bold uppercase tracking-widest">Nutrición</h3>
              </div>
              <div className="space-y-3">
                {recommendations.filter(r => r.category === "food").map((rec) => (
                  <motion.div
                    layout
                    key={rec.id}
                    onClick={() => toggleComplete(rec.id, rec.completed)}
                    className={`group rounded-3xl p-5 transition-all cursor-pointer border ${rec.completed
                      ? 'bg-surface-variant opacity-60 border-transparent'
                      : 'bg-surface-container border-outline/10 hover:border-secondary/50'
                      }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all ${rec.completed ? 'bg-secondary border-secondary text-on-secondary' : 'border-outline'}`}>
                        {rec.completed && <CheckCircle2 className="h-4 w-4" />}
                      </div>
                      <p className={`text-[17px] leading-snug font-bold ${rec.completed ? 'text-on-surface-variant line-through' : 'text-on-surface'}`}>
                        {rec.content}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          </div>

          {/* Reporte Semanal */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[32px] bg-surface-container p-8 border border-outline/5"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary-container text-on-secondary-container">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-on-surface">Reporte Semanal</h3>
                  <p className="text-sm font-medium text-on-surface-variant">
                    {weeklyReport ? "Análisis de tu evolución reciente" : "Genera tu resumen de los últimos 7 días"}
                  </p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={isGeneratingReport}
                onClick={handleGenerateWeeklyReport}
                className="flex items-center gap-2 rounded-full bg-secondary-container px-4 py-2.5 text-sm font-bold text-on-secondary-container shadow-sm hover:brightness-105 transition-all disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${isGeneratingReport ? 'animate-spin' : ''}`} />
                {weeklyReport ? "Actualizar" : "Generar Reporte"}
              </motion.button>
            </div>

            {weeklyReport ? (
              <div className="space-y-6">
                <div className="p-6 rounded-3xl bg-surface-variant/30 border border-outline/10">
                  <p className="text-lg leading-relaxed text-on-surface font-medium italic">
                    "{weeklyReport.summary}"
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-6 rounded-3xl bg-primary-container/30 border border-primary-container/20">
                    <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">Estado Dominante</p>
                    <p className="text-2xl font-black text-on-surface">{weeklyReport.dominant_mood}</p>
                  </div>
                  <div className="p-6 rounded-3xl bg-secondary-container/30 border border-secondary-container/20 space-y-3">
                    <p className="text-xs font-bold uppercase tracking-widest text-secondary">Descubrimientos Clave</p>
                    <ul className="space-y-2">
                      {weeklyReport.key_insights.map((insight, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-on-surface-variant font-medium">
                          <CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />
                          <span>{insight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center space-y-4">
                <FileText className="h-16 w-16 text-outline mx-auto opacity-30" />
                <p className="text-on-surface-variant font-medium max-w-sm mx-auto">
                  La IA analizará tus registros de los últimos 7 días para ofrecerte perspectivas sobre tu mundo emocional.
                </p>
              </div>
            )}
          </motion.div>

          <MoodCalendar
            emotionLogs={emotionLogs}
            userId={userId}
            onLogAdded={() => userId ? fetchEmotionLogs(userId) : null}
          />
          <WellnessGoals userId={userId} />
          <SleepTracker userId={userId} />

        </div>

        {/* Sidebar Derecha */}
        <div className="space-y-8">
          {/* Monitoreo Emocional */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-[32px] bg-surface-container p-8 shadow-sm border border-outline/5"
          >
            <div className="mb-8 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                  <Star className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-lg text-on-surface">Ánimo Reciente</h3>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-outline">Powered by AI</span>
            </div>

            <div className="space-y-6">
              <div className="h-[300px] w-full mt-4 -ml-4">
                <EmotionDashboard logs={emotionLogs} />
              </div>

              {/* Secondary list of logs */}
              {emotionLogs.length > 0 ? (
                emotionLogs.slice(0, 3).map((log, i) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-4"
                  >
                    <div className={`h-12 w-1.5 rounded-full ${getMoodColor(log.mood)}`} />
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-[13px] text-on-surface">{getMoodLabel(log.mood)}</span>
                        <span className="text-[10px] font-bold text-outline uppercase">{new Date(log.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-outline/10 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${log.intensity * 10}%` }}
                            className={`h-full ${getMoodColor(log.mood)}`}
                          />
                        </div>
                        <span className="text-[10px] font-bold w-4 text-on-surface">{log.intensity}</span>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="py-10 text-center space-y-4">
                  <Sparkles className="h-8 w-8 mx-auto text-outline animate-pulse" />
                  <p className="text-sm font-bold text-outline italic">Chatea con SentIA para empezar el seguimiento.</p>
                </div>
              )}
            </div>

            <div className="mt-8 pt-6 border-t border-outline/10">
              <button className="w-full text-center text-xs font-bold uppercase tracking-widest text-primary hover:brightness-90 transition-all"> Ver historial completo </button>
            </div>
          </motion.div>

          {/* Actividad Semanal */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-[32px] bg-surface-container p-8 shadow-sm border border-outline/5"
          >
            <div className="mb-6 flex items-center gap-3">
              <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-secondary/10 text-secondary border border-secondary/20">
                <LineChart className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-lg text-on-surface">Actividad</h3>
            </div>

            <div className="flex h-32 items-end gap-3 px-2 min-h-[128px]">
              {weeklyData.map((day) => (
                <div key={day.day} className="flex flex-1 flex-col items-center gap-2 group">
                  <div className="w-full relative h-[100px] flex items-end">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${day.intensity * 8 + 10}px` }}
                      className="w-full rounded-full bg-secondary shadow-sm group-hover:bg-primary transition-all cursor-pointer"
                    />
                  </div>
                  <span className="text-[10px] font-bold text-outline uppercase tracking-tighter">{day.day}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="rounded-[32px] bg-primary p-8 text-on-primary shadow-lg relative overflow-hidden group"
          >
            <HeartPulse className="mb-4 h-10 w-10 text-on-primary opacity-80" />
            <h4 className="text-xl font-bold mb-3 tracking-tight">Consejo de SentIA</h4>
            <p className="text-sm font-medium leading-relaxed italic opacity-90">
              "El progreso no es lineal. Celebrar estas pequeñas acciones diarias es el primer paso para una mente más tranquila."
            </p>
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {showBadgeModal && currentBadge && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-lg overflow-hidden rounded-[32px] bg-surface-container p-12 text-center shadow-2xl border border-outline/10"
            >
              <button
                onClick={() => setShowBadgeModal(false)}
                className="absolute right-8 top-8 rounded-full p-2 text-on-surface-variant hover:bg-surface-variant transition-colors"
              >
                <X className="h-6 w-6" />
              </button>

              <div className="flex justify-center mb-10">
                <div className="relative">
                  <div className="relative flex h-32 w-32 items-center justify-center rounded-3xl bg-primary-container text-primary shadow-inner">
                    <currentBadge.icon className="h-16 w-16 drop-shadow-md" />
                  </div>
                </div>
              </div>

              <h2 className="text-3xl font-bold text-on-surface mb-4 tracking-tight"> ¡Logro Alcanzado! </h2>
              <div className="inline-block rounded-full bg-secondary-container px-6 py-2 text-sm font-bold text-on-secondary-container mb-10 border border-outline/10">
                {currentBadge.name}
              </div>

              <div className="rounded-3xl bg-surface-variant p-8 mb-10 font-bold italic text-lg text-on-surface-variant leading-relaxed">
                "{currentBadge.message}"
              </div>

              <button
                onClick={() => setShowBadgeModal(false)}
                className="w-full rounded-full bg-primary py-5 text-lg font-bold text-on-primary shadow-lg hover:brightness-110 active:scale-[0.98] transition-all"
              >
                Continuar
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

