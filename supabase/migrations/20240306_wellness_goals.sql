-- Migración para Metas de Bienestar (Clarity v4.0)
-- Descripción: Tabla para que los usuarios creen y hagan seguimiento de metas personales.

CREATE TABLE IF NOT EXISTS public.wellness_goals (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    title text NOT NULL,
    category text NOT NULL CHECK (category IN ('mindfulness', 'sleep', 'active', 'social', 'nutrition', 'other')),
    target_days integer NOT NULL DEFAULT 7,
    current_days integer NOT NULL DEFAULT 0,
    is_completed boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.wellness_goals ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad
CREATE POLICY "Users can view own wellness_goals" 
    ON wellness_goals FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wellness_goals" 
    ON wellness_goals FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wellness_goals" 
    ON wellness_goals FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own wellness_goals" 
    ON wellness_goals FOR DELETE USING (auth.uid() = user_id);
