-- Migración para Sistema de Rachas (Clarity v4.6)
-- Descripción: Tabla para rastrear los días consecutivos que un usuario completa sus misiones.

CREATE TABLE IF NOT EXISTS public.user_streaks (
    user_id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    current_streak integer NOT NULL DEFAULT 0,
    best_streak integer NOT NULL DEFAULT 0,
    last_streak_date date,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad
CREATE POLICY "Users can view own streaks" 
    ON user_streaks FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own streaks" 
    ON user_streaks FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own streaks" 
    ON user_streaks FOR UPDATE USING (auth.uid() = user_id);
