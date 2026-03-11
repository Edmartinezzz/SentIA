import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
    return new Response(null, { status: 204, headers: corsHeaders });
}

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get("Authorization");
        const token = authHeader?.split(" ")[1];

        if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401, headers: corsHeaders });

        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) return NextResponse.json({ error: "Sesión inválida" }, { status: 401, headers: corsHeaders });

        const userId = user.id;

        // Calcular rango de fechas (últimos 7 días)
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 7);

        // 1. Obtener registros emocionales de la semana
        const { data: emotions } = await supabase
            .from("emotion_logs")
            .select("mood, intensity, created_at")
            .eq("user_id", userId)
            .gte("created_at", startDate.toISOString())
            .lte("created_at", endDate.toISOString());

        // 2. Obtener entradas de diario de la semana
        const { data: journals } = await supabase
            .from("journal_entries")
            .select("content, created_at")
            .eq("user_id", userId)
            .gte("created_at", startDate.toISOString())
            .lte("created_at", endDate.toISOString());

        if ((!emotions || emotions.length === 0) && (!journals || journals.length === 0)) {
            return NextResponse.json({
                error: "Not enough data",
                message: "Necesitas registrar al menos una emoción o escribir en el diario para generar un reporte semanal."
            }, { status: 400, headers: corsHeaders });
        }

        // 3. Preparar contexto para la IA
        let promptContext = `Analiza los siguientes datos psicológicos y diarios de la última semana de un usuario.
        Genera un reporte clínico-amigable en formato JSON con:
        - "dominant_mood": El estado de ánimo principal (e.g., "Ansiedad moderada", "Calma estable").
        - "summary": Un párrafo (max 60 palabras) resumiendo la semana, usando tono empático y positivo.
        - "key_insights": Array con 3 descubrimientos clave o patrones observados (strings cortos).

        DATOS:\n`;

        if (emotions && emotions.length > 0) {
            promptContext += `\nRegistros emocionales:\n`;
            emotions.forEach(e => {
                promptContext += `- ${new Date(e.created_at).toLocaleDateString()}: Ánimo=${e.mood}, Intensidad=${e.intensity}/10\n`;
            });
        }

        if (journals && journals.length > 0) {
            promptContext += `\nEntradas de diario:\n`;
            journals.forEach(j => {
                const excerpt = j.content.substring(0, 200).replace(/\n/g, " ");
                promptContext += `- ${new Date(j.created_at).toLocaleDateString()}: "${excerpt}..."\n`;
            });
        }

        promptContext += `\nRespuesta SOLO en JSON:
        {
          "dominant_mood": "string",
          "summary": "string",
          "key_insights": ["string", "string", "string"]
        }`;

        try {
            const completion = await groq.chat.completions.create({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: "Eres un psicólogo clínico experto en bienestar mental. Responde solo en JSON válido." },
                    { role: "user", content: promptContext }
                ],
                temperature: 0.4,
                max_tokens: 512,
            });

            const rawContent = completion.choices[0]?.message?.content || "";
            const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
            const report = JSON.parse(jsonMatch ? jsonMatch[0] : rawContent);

            // 4. Guardar reporte en Supabase
            const { createClient } = await import('@supabase/supabase-js');
            const supabaseAuth = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                { global: { headers: { Authorization: `Bearer ${token}` } } }
            );

            const { data: savedReport, error: saveError } = await supabaseAuth
                .from("weekly_reports")
                .insert({
                    user_id: userId,
                    start_date: startDate.toISOString().split('T')[0],
                    end_date: endDate.toISOString().split('T')[0],
                    dominant_mood: report.dominant_mood,
                    summary: report.summary,
                    key_insights: report.key_insights
                })
                .select()
                .single();

            if (saveError) {
                console.error("Error guardando reporte:", saveError);
                return NextResponse.json({ success: true, report: { ...report, id: "temp" } }, { headers: corsHeaders });
            }

            return NextResponse.json({ success: true, report: savedReport }, { headers: corsHeaders });

        } catch (groqErr) {
            console.error("Groq error in weekly report:", groqErr);
            return NextResponse.json({ error: "No se pudo generar el reporte" }, { status: 500, headers: corsHeaders });
        }

    } catch (error: any) {
        console.error("Error generating weekly report:", error);
        return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
    }
}

