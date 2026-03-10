import { supabase } from "@/lib/supabase";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

type IncomingMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

type IncomingSettings = {
  briefResponses?: boolean;
  actionFocus?: boolean;
};

type ChatRequest = {
  messages?: IncomingMessage[];
  userName?: string | null;
  settings?: IncomingSettings;
};

export async function POST(req: Request) {
  try {
    const { messages, userName, settings } = (await req.json()) as ChatRequest;

    // 1. Obtener el token de autorización
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.split(" ")[1];

    let contextInfo = "";

    if (token) {
      // 2. Obtener el usuario autenticado
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);

      if (!authError && user) {
        const userId = user.id;

        // 3. Obtener contexto de sueño reciente
        const { data: sleepLog } = await supabase
          .from("sleep_logs")
          .select("hours, quality")
          .eq("user_id", userId)
          .order("date", { ascending: false })
          .limit(1)
          .maybeSingle();

        // 4. Obtener contexto de ánimo reciente
        const { data: emotionLog } = await supabase
          .from("emotion_logs")
          .select("mood, intensity")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (sleepLog || emotionLog) {
          contextInfo = "\nCONTEXTO ACTUAL DEL USUARIO:";
          if (sleepLog) {
            contextInfo += `\n- Último registro de sueño: ${sleepLog.hours} horas (Calidad: ${sleepLog.quality}).`;
          }
          if (emotionLog) {
            contextInfo += `\n- Último ánimo detectado: ${emotionLog.mood} (Intensidad: ${emotionLog.intensity}/10).`;
          }
        }
      }
    }

    const namePrefix = userName ? `El nombre del usuario es ${userName}.` : "";
    const briefMode = settings?.briefResponses
      ? "Sé conciso y ve al punto directamente."
      : "";
    const actionMode = settings?.actionFocus
      ? "Prioriza consejos prácticos y accionables."
      : "";

    const systemPrompt = `Eres Clara, una asistente de bienestar emocional empática, cálida y profesional. ${namePrefix}
Tu objetivo es ofrecer apoyo emocional, psicoeducación y técnicas basadas en evidencia (CBT, Mindfulness).
IMPORTANTE: No eres terapeuta ni médico. Si detectas crisis severas, deriva a profesionales.
Responde siempre en español y de forma natural y humana.
${briefMode} ${actionMode}
${contextInfo}`;

    const ollamaMessages = [
      { role: "system" as const, content: systemPrompt },
      ...(messages || []).map((m) => ({
        role: m.role as "user" | "assistant" | "system",
        content: m.content,
      })),
    ];

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: ollamaMessages,
      temperature: 0.7,
      max_tokens: 1024,
    });

    const content =
      completion.choices[0]?.message?.content ??
      "Lo siento, no pude generar una respuesta en este momento.";

    return new Response(content, {
      status: 200,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (error) {
    console.error("Error in chat route (Groq):", error);
    return new Response(
      "Ocurrió un error al procesar tu solicitud. Por favor intenta de nuevo.",
      { status: 500, headers: { "Content-Type": "text/plain; charset=utf-8" } },
    );
  }
}
