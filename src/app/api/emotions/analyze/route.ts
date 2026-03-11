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

        if (!token) {
            return NextResponse.json({ error: "Falta token de autorización" }, { status: 401, headers: corsHeaders });
        }

        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ error: "Sesión inválida" }, { status: 401, headers: corsHeaders });
        }

        const { conversationId, messages } = await req.json();

        if (!messages || messages.length === 0) {
            return NextResponse.json({ error: "No hay mensajes para analizar" }, { status: 400, headers: corsHeaders });
        }

        // Formatear contexto para el análisis
        const chatContext = messages
            .slice(-10)
            .map((m: any) => `${m.role === "user" ? "Usuario" : "SentIA"}: ${m.content}`)
            .join("\n");

        const prompt = `Analiza el siguiente fragmento de una conversación de apoyo emocional y determina el estado emocional predominante del Usuario.
        
        Contexto:
        ${chatContext}

        Debes responder ÚNICAMENTE en formato JSON con la siguiente estructura:
        {
          "mood": "Uno de: joy, sadness, anger, anxiety, calm",
          "intensity": número del 1 al 10,
          "justification": "Una frase breve que explique la detección"
        }`;

        let analysis = { mood: "calm", intensity: 5, justification: "Análisis básico (fallback)" };

        try {
            const completion = await groq.chat.completions.create({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: "Eres un experto en psicología emocional. Responde solo en JSON válido." },
                    { role: "user", content: prompt }
                ],
                temperature: 0.3,
                max_tokens: 256,
            });

            const rawContent = completion.choices[0]?.message?.content || "";
            const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                analysis = JSON.parse(jsonMatch[0]);
            }
        } catch (err) {
            console.warn("Groq connection failed, using keyword fallback.");
            const lowerChat = chatContext.toLowerCase();
            if (lowerChat.includes("triste") || lowerChat.includes("llorar") || lowerChat.includes("mal")) {
                analysis = { mood: "sadness", intensity: 6, justification: "Detección por palabras clave (tristeza)" };
            } else if (lowerChat.includes("ansiedad") || lowerChat.includes("nervioso") || lowerChat.includes("miedo")) {
                analysis = { mood: "anxiety", intensity: 7, justification: "Detección por palabras clave (ansiedad)" };
            } else if (lowerChat.includes("enojado") || lowerChat.includes("rabia") || lowerChat.includes("furia")) {
                analysis = { mood: "anger", intensity: 7, justification: "Detección por palabras clave (enojo)" };
            } else if (lowerChat.includes("feliz") || lowerChat.includes("bien") || lowerChat.includes("alegre")) {
                analysis = { mood: "joy", intensity: 8, justification: "Detección por palabras clave (alegría)" };
            }
        }

        try {
            const { createClient } = await import('@supabase/supabase-js');
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
            const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

            const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
                global: { headers: { Authorization: `Bearer ${token}` } }
            });

            const { error: insertError } = await supabaseAuth
                .from("emotion_logs")
                .insert({
                    user_id: user.id,
                    conversation_id: conversationId,
                    mood: analysis.mood,
                    intensity: Math.min(10, Math.max(1, parseInt(String(analysis.intensity)) || 5)),
                    analysis_content: analysis.justification
                });

            if (insertError) {
                console.error("Error al insertar log emocional:", insertError);
                return NextResponse.json({ success: false, error: insertError.message, analysis });
            }

            return NextResponse.json({ success: true, analysis }, { headers: corsHeaders });

        } catch (dbErr: any) {
            console.error("Database error in emotion analysis:", dbErr);
            return NextResponse.json({ success: false, error: dbErr.message, analysis });
        }

    } catch (error: any) {
        console.error("Error en API de emociones:", error);
        return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
    }
}

