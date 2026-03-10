"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { NameType } from "recharts/types/component/DefaultTooltipContent";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

type EmotionLog = {
    id: string;
    created_at: string;
    mood: string;
    intensity: number;
};

// Map moods to a vertical scale for the chart
const moodScale: Record<string, number> = {
    joy: 5,
    calm: 4,
    anxiety: 3,
    sadness: 2,
    anger: 1,
};

const getMoodName = (value: number) => {
    switch (Math.round(value)) {
        case 5: return "Alegría";
        case 4: return "Calma";
        case 3: return "Ansiedad";
        case 2: return "Tristeza";
        case 1: return "Enojo";
        default: return "";
    }
};

export default function EmotionDashboard({ logs }: { logs: EmotionLog[] }) {
    const { theme } = useTheme();
    const isDark = theme === "dark";
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Process logs for the chart: group by day or keep chronological. We'll keep chronological for a smooth timeline.
    const data = [...logs]
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        .map(log => ({
            date: log.created_at,
            formattedDate: format(parseISO(log.created_at), "dd MMM", { locale: es }),
            time: format(parseISO(log.created_at), "HH:mm"),
            moodValue: moodScale[log.mood] || 3,
            intensity: log.intensity,
            originalMood: log.mood
        }));

    if (data.length === 0) {
        return (
            <div className="flex h-64 items-center justify-center rounded-3xl bg-surface-variant/30 border border-outline/10">
                <p className="text-on-surface-variant font-medium text-sm">No hay suficientes datos emocionales para generar el gráfico.</p>
            </div>
        );
    }

    if (!mounted) return <div className="w-full h-72 bg-surface-variant/10 rounded-3xl animate-pulse" />;

    return (
        <div className="w-full h-72 pb-4 min-h-[288px]">
            <ResponsiveContainer width="100%" height="100%" debounce={100}>
                <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={isDark ? "#4EDAD9" : "#006A6A"} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={isDark ? "#4EDAD9" : "#006A6A"} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"} />
                    <XAxis
                        dataKey="formattedDate"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: isDark ? "#BEC9C8" : "#6F7979" }}
                        dy={10}
                    />
                    <YAxis
                        domain={[1, 5]}
                        ticks={[1, 2, 3, 4, 5]}
                        tickFormatter={getMoodName}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: isDark ? "#BEC9C8" : "#6F7979", fontWeight: 600 }}
                        width={60}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: isDark ? "#19201F" : "#F4FBFA",
                            borderRadius: "16px",
                            border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
                            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                            padding: "12px",
                        }}
                        labelStyle={{ color: isDark ? "#899392" : "#6F7979", marginBottom: "4px", fontSize: "12px", fontWeight: "bold" }}
                        itemStyle={{ color: isDark ? "#DDE4E3" : "#161D1D", fontSize: "14px", fontWeight: "bold" }}
                        formatter={(value: any, name: NameType | undefined, props: any) => [getMoodName(Number(value) || 3), props.payload.time]}
                        labelFormatter={(label) => `${label}`}
                    />
                    <Area
                        type="monotone"
                        dataKey="moodValue"
                        stroke={isDark ? "#4EDAD9" : "#006A6A"}
                        strokeWidth={4}
                        fillOpacity={1}
                        fill="url(#colorMood)"
                        animationDuration={1500}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
