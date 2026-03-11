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
        const { items } = await req.json();

        if (!items || !Array.isArray(items) || items.length < 1) {
            return NextResponse.json({ error: "Datos de gratitud inválidos." }, { status: 400, headers: corsHeaders });
        }

        let promptContext = `El usuario ha registrado las siguientes cosas por las que siente gratitud hoy:\n`;
        items.forEach((item: string, index: number) => {
            promptContext += `${index + 1}. "${item}"\n`;
        });
        promptContext += `\nBasado en estas cosas buenas que le pasaron al usuario, genera UNA ÚNICA afirmación positiva, empática y motivacional en formato JSON.
La afirmación debe ser corta (máximo 25 palabras), sonar natural (no robótica) y conectar con los temas de los que está agradecido.
RESPONDE ÚNICAMENTE CON EL JSON: { "affirmation": "..." }`;

        let affirmationText = "Hoy es un buen día y valoro lo que tengo.";

        try {
            const completion = await groq.chat.completions.create({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: "Eres Clara, un psicólogo empático respondiendo estrictamente en JSON." },
                    { role: "user", content: promptContext }
                ],
                temperature: 0.7,
                max_tokens: 128,
            });

            const rawContent = completion.choices[0]?.message?.content || "";
            const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
            const parsedResponse = JSON.parse(jsonMatch ? jsonMatch[0] : rawContent);

            if (parsedResponse.affirmation) {
                affirmationText = parsedResponse.affirmation;
            }
        } catch (llmError) {
            console.error("Error contactando a Groq:", llmError);
        }

        // Guardar en Supabase con cliente autenticado
        const todayStr = new Date().toISOString().split('T')[0];

        const { createClient } = await import('@supabase/supabase-js');
        const supabaseAuth = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { global: { headers: { Authorization: `Bearer ${token}` } } }
        );

        const { data: logEntry, error: insertError } = await supabaseAuth
            .from("gratitude_logs")
            .upsert({
                user_id: userId,
                date: todayStr,
                items: items,
                affirmation: affirmationText
            }, { onConflict: 'user_id, date' })
            .select()
            .single();

        if (insertError) {
            console.error("Error al insertar log de gratitud:", insertError);
            return NextResponse.json({ success: false, error: insertError.message });
        }

        return NextResponse.json({ success: true, log: logEntry }, { headers: corsHeaders });

    } catch (error: any) {
        console.error("Error procesando práctica de gratitud:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500, headers: corsHeaders });
    }
}

