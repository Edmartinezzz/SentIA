-- Tabla para el seguimiento emocional v3.0
CREATE TABLE IF NOT EXISTS public.emotion_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    conversation_id uuid REFERENCES public.conversations ON DELETE CASCADE,
    mood text NOT NULL, -- 'joy', 'sadness', 'anger', 'anxiety', 'calm'
    intensity integer NOT NULL CHECK (intensity BETWEEN 1 AND 10),
    analysis_content text, -- Justificación breve de la IA sobre el estado detectado
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS en emotion_logs
ALTER TABLE public.emotion_logs ENABLE ROW LEVEL SECURITY;

-- Políticas para emotion_logs (cada usuario ve sus propios registros)
CREATE POLICY "Users can view own emotion logs" 
    ON emotion_logs FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own emotion logs" 
    ON emotion_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Índice para mejorar las búsquedas por usuario y tiempo (para gráficos)
CREATE INDEX idx_emotion_logs_user_date ON public.emotion_logs (user_id, created_at DESC);
