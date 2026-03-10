-- Migración para Misiones Diarias (Clarity v4.5)
-- Descripción: Tabla para rastrear pequeñas misiones diarias y gamificación.

CREATE TABLE IF NOT EXISTS public.daily_missions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    title text NOT NULL,
    category text NOT NULL,
    is_completed boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.daily_missions ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad
CREATE POLICY "Users can view own daily_missions" 
    ON daily_missions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily_missions" 
    ON daily_missions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily_missions" 
    ON daily_missions FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own daily_missions" 
    ON daily_missions FOR DELETE USING (auth.uid() = user_id);
