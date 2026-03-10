import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get("Authorization");
        const token = authHeader?.split(" ")[1];

        if (!token) {
            return NextResponse.json({ error: "Falta token de autorización" }, { status: 401 });
        }

        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) {
            return NextResponse.json({ error: "Sesión inválida" }, { status: 401 });
        }

        const { content } = await req.json();

        if (!content || content.length < 10) {
            return NextResponse.json({ error: "Contenido demasiado corto" }, { status: 400 });
        }

        const prompt = `Actúa como un psicólogo clínico especialista en Terapia Cognitivo-Conductual (CBT).
        Analiza la siguiente entrada de diario en busca de "distorsiones cognitivas" (ej: pensamiento de todo o nada, catastrofización, personalización, razonamiento emocional, etc.).
        
        Entrada del usuario:
        "${content}"

        Tu tarea es:
        1. Detectar el estado emocional predominante.
        2. Identificar distorsiones cognitivas específicas (si las hay).
        3. Ofrecer un "Replanteamiento" (Reframe) clínico que sea empático, validador y ofrezca una perspectiva más equilibrada.
        4. Clasificar la entrada en una categoría (ej: "Reflexión Personal", "Preocupación", "Logro", "Relaciones").

        RESPONDE ÚNICAMENTE EN FORMATO JSON.
        Formato:
        {
          "mood": "Nombre del ánimo",
          "distortions": ["Distorsión 1", "Distorsión 2"],
          "reframe": "Explicación empática y replanteamiento saludable",
          "category": "Categoría",
          "has_distortions": true
        }`;

        try {
            const completion = await groq.chat.completions.create({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: "Eres un psicólogo clínico senior de orientación CBT. Responde solo en JSON válido sin explicaciones adicionales." },
                    { role: "user", content: prompt }
                ],
                temperature: 0.3,
                max_tokens: 512,
            });

            const rawContent = completion.choices[0]?.message?.content || "";
            const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
            const analysis = JSON.parse(jsonMatch ? jsonMatch[0] : rawContent);

            return NextResponse.json({ success: true, analysis });

        } catch (groqErr) {
            console.error("Groq Analysis Error:", groqErr);
            return NextResponse.json({
                success: true,
                analysis: {
                    mood: "Reflexivo",
                    distortions: [],
                    reframe: "Gracias por compartir tus pensamientos. Sigue explorando tu mundo interior.",
                    category: "General",
                    has_distortions: false,
                    is_fallback: true
                }
            });
        }

    } catch (error) {
        console.error("General Journal API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
