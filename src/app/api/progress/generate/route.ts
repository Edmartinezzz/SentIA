import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get("Authorization");
        const token = authHeader?.split(" ")[1];

        if (!token) {
            console.error("API Error: No se proporcionó token");
            return NextResponse.json({ error: "Falta token de autorización" }, { status: 401 });
        }

        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            console.error("API Auth Error:", authError?.message || "Usuario no encontrado");
            return NextResponse.json({ error: "Sesión inválida o expirada" }, { status: 401 });
        }

        const userId = user.id;

        // 1. Obtener las conversaciones del usuario
        const { data: convs, error: convsError } = await supabase
            .from("conversations")
            .select("id")
            .eq("user_id", userId);

        if (convsError) throw convsError;
        const convIds = convs?.map(c => c.id) || [];

        let chatContext = "No hay mensajes previos suficientes para personalizar.";

        if (convIds.length > 0) {
            const { data: messages, error: messagesError } = await supabase
                .from("messages")
                .select("content, role")
                .in("conversation_id", convIds)
                .order("created_at", { ascending: false })
                .limit(15);

            if (!messagesError && messages && messages.length > 0) {
                chatContext = messages
                    .reverse()
                    .map((m) => `${m.role === "user" ? "Usuario" : "Clarity"}: ${m.content}`)
                    .join("\n");
            }
        }

        // 3. Pedir a Groq que genere las recomendaciones
        const prompt = `Actúa como un psicólogo clínico especialista en bienestar y un nutricionista deportivo/emocional. 
        Analiza el siguiente contexto de chat para detectar patrones cognitivos, niveles de cortisol (estrés), ansiedad o melancolía.
        
        Contexto de la conversación:
        ${chatContext}

        Tu tarea es generar un plan de acción de ALTO NIVEL con 3 actividades técnicas y 3 recomendaciones nutricionales neuro-efectivas.

        REQUISITOS PARA ACTIVIDADES (Activities):
        - Usa técnicas profesionales: Terapia Cognitivo-Conductual (CBT), Mindfulness-Based Stress Reduction (MBSR), técnica Pomodoro, respiración diafragmática o escritura terapéutica.
        - Sé específico: No digas "medita", di "Practica 5 min de escaneo corporal (técnica MBSR) para reducir la tensión física".

        REQUISITOS PARA ALIMENTOS (Food):
        - Basa las recomendaciones en neurociencia: Alimentos precursores de serotonina, dopamina o reguladores de glucosa.
        - Ejemplo: En lugar de "come fruta", di "Consume un puñado de nueces (ácidos grasos Omega-3) para apoyar la plasticidad neuronal".

        RESPONDE ÚNICAMENTE EN FORMATO JSON.
        Formato:
        {
          "activities": ["Descripción técnica y profesional 1", "... 2", "... 3"],
          "food": ["Descripción con base nutricional 1", "... 2", "... 3"]
        }`;

        try {
            console.log("Iniciando petición a Groq...");
            const completion = await groq.chat.completions.create({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: "Eres un consultor senior en bienestar emocional y neuro-nutrición. Responde solo en JSON." },
                    { role: "user", content: prompt }
                ],
                temperature: 0.5,
                max_tokens: 512,
            });

            const rawContent = completion.choices[0]?.message?.content || "";
            console.log("Respuesta de Groq recibida.");

            // Extraer JSON por si la IA añade texto extra
            const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
            const recommendations = JSON.parse(jsonMatch ? jsonMatch[0] : rawContent);
            console.log("Recomendaciones parseadas con éxito.");

            // 4. Operaciones en base de datos con cliente autenticado
            const { createClient } = await import('@supabase/supabase-js');
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
            const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

            const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
                global: { headers: { Authorization: `Bearer ${token}` } }
            });

            // Borrar recomendaciones anteriores (Deshabilitado para mantener historial)
            // await supabaseAuth.from("progress_recommendations").delete().eq("user_id", userId);

            // 5. Insertar nuevas
            const toInsert = [
                ...recommendations.activities.slice(0, 3).map((a: string) => ({
                    user_id: userId,
                    content: a,
                    category: "activity",
                    completed: false
                })),
                ...recommendations.food.slice(0, 3).map((f: string) => ({
                    user_id: userId,
                    content: f,
                    category: "food",
                    completed: false
                }))
            ];

            const { data: insertedData, error: insertError } = await supabaseAuth.from("progress_recommendations").insert(toInsert).select();
            if (insertError) {
                console.error("Error al insertar recomendaciones:", insertError);
                // Si la DB falla, igual devolvemos las recomendaciones generadas para que el UI no se rompa
                return NextResponse.json({ success: true, recommendations: toInsert.map((item, idx) => ({ ...item, id: `temp-${idx}` })) });
            }

            console.log("Nuevas recomendaciones guardadas en Supabase.");
            return NextResponse.json({ success: true, recommendations: insertedData });

        } catch (groqErr: any) {
            console.error("Error durante el proceso de Groq:", groqErr.message);
            throw groqErr; // Re-lanzar para activar el catch general
        }

    } catch (error: any) {
        console.error("Error al generar progreso:", error);

        // Datos por defecto con IDs para evitar errores en el frontend
        const defaultData = [
            { id: "def-1", content: "Realizar 5 minutos de respiración consciente (técnica CBT)", category: "activity", completed: false },
            { id: "def-2", content: "Caminar 15 min al aire libre para regular el cortisol", category: "activity", completed: false },
            { id: "def-3", content: "Escribir tres cosas positivas de tu día", category: "activity", completed: false },
            { id: "def-4", content: "Consumir un puñado de nueces (ácidos grasos Omega-3)", category: "food", completed: false },
            { id: "def-5", content: "Incorporar espinacas (magnesio) en tu próxima comida", category: "food", completed: false },
            { id: "def-6", content: "Infusión de manzanilla antes de dormir", category: "food", completed: false }
        ];

        return NextResponse.json({ success: true, error: "Fallback used", recommendations: defaultData }, { status: 200 });
    }
}
