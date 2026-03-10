-- Migración para Reportes Semanales (Clarity v4.0)
-- Descripción: Tabla para almacenar los análisis de bienestar semanales generados por IA

CREATE TABLE IF NOT EXISTS public.weekly_reports (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    start_date timestamp with time zone NOT NULL,
    end_date timestamp with time zone NOT NULL,
    dominant_mood text NOT NULL,
    summary text NOT NULL,
    key_insights jsonb DEFAULT '[]'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS en weekly_reports
ALTER TABLE public.weekly_reports ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad
CREATE POLICY "Users can view own weekly_reports" 
    ON weekly_reports FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own weekly_reports" 
    ON weekly_reports FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own weekly_reports" 
    ON weekly_reports FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own weekly_reports" 
    ON weekly_reports FOR DELETE USING (auth.uid() = user_id);
