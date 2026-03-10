import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
    try {
        const { userId, conversationId, context } = await req.json();

        let chatContext = context || "";

        if (!chatContext && userId && userId !== "guest") {
            if (conversationId) {
                const { data: messages, error: msgError } = await supabase
                    .from("messages")
                    .select("content, role")
                    .eq("conversation_id", conversationId)
                    .order("created_at", { ascending: true });

                if (msgError) throw msgError;

                chatContext = messages
                    ?.map((m) => `${m.role === "user" ? "Usuario" : "Clarity"}: ${m.content}`)
                    .join("\n") || "";
            } else {
                const { data: convs, error: convError } = await supabase
                    .from("conversations")
                    .select("id")
                    .eq("user_id", userId);

                if (convError) throw convError;

                if (convs && convs.length > 0) {
                    const convIds = convs.map(c => c.id);
                    const { data: messages, error: msgError } = await supabase
                        .from("messages")
                        .select("content, role")
                        .in("conversation_id", convIds)
                        .order("created_at", { ascending: false })
                        .limit(30);

                    if (msgError) throw msgError;

                    chatContext = messages
                        ?.reverse()
                        .map((m) => `${m.role === "user" ? "Usuario" : "Clarity"}: ${m.content}`)
                        .join("\n") || "";
                }
            }
        }

        const seed = Math.floor(Math.random() * 1000);
        const prompt = `
            Basándote en el siguiente historial de chat, recomienda exactamente 3 Libros, 3 Canciones y 3 Podcasts.
            INTENTA VARIAR las recomendaciones. No te limites solo a lo más obvio, busca recursos profundos y variados.
            
            ID de Variación: ${seed}
            HISTORIAL:
            ${chatContext || "No hay historial previo - genera recomendaciones generales de bienestar emocional altamente variadas."}

            FORMATO DE RESPUESTA (Responde ÚNICAMENTE con un JSON válido):
            {
              "books": [{"title": "...", "author": "...", "reason": "...", "image_tag": "inglés keyword"}],
              "songs": [{"title": "...", "artist": "...", "reason": "...", "image_tag": "keyword"}],
              "podcasts": [{"title": "...", "author": "...", "reason": "...", "image_tag": "keyword"}]
            }
        `;

        try {
            const completion = await groq.chat.completions.create({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: "Eres un experto en biblioterapia y musicoterapia. Tu objetivo es dar recomendaciones ÚNICAS y VARIADAS cada vez. Responde solo en JSON." },
                    { role: "user", content: prompt }
                ],
                temperature: 0.8,
                max_tokens: 1024,
            });

            const rawContent = completion.choices[0]?.message?.content || "";
            const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
            const recommendations = JSON.parse(jsonMatch ? jsonMatch[0] : rawContent);

            return NextResponse.json(recommendations);

        } catch (groqErr) {
            console.error("Groq error in recommendations:", groqErr);
            throw groqErr;
        }

    } catch (error: any) {
        console.error("Error generating recommendations:", error);

        return NextResponse.json({
            books: [
                { title: "El Hombre en Busca de Sentido", author: "Viktor Frankl", reason: "Resiliencia extrema.", image_tag: "mountain" },
                { title: "Hábitos Atómicos", author: "James Clear", reason: "Pequeños cambios.", image_tag: "clock" },
                { title: "El Poder del Ahora", author: "Eckhart Tolle", reason: "Presencia mental.", image_tag: "meditation" }
            ],
            songs: [
                { title: "Here Comes The Sun", artist: "The Beatles", reason: "Optimismo.", image_tag: "sunrise" },
                { title: "Weightless", artist: "Marconi Union", reason: "Relajación pura.", image_tag: "clouds" },
                { title: "Don't Stop Me Now", artist: "Queen", reason: "Energía.", image_tag: "energy" }
            ],
            podcasts: [
                { title: "Entiende tu Mente", author: "Molo Cebrián", reason: "Psicología cotidiana.", image_tag: "brain" },
                { title: "Se Regalan Dudas", author: "Ashley Frangie", reason: "Cuestionamiento.", image_tag: "questions" },
                { title: "Medita Podcast", author: "Mar del Cerro", reason: "Paz interior.", image_tag: "breath" }
            ]
        });
    }
}
