-- Migración para Práctica de Gratitud (Clarity v4.0)
-- Descripción: Tabla para guardar el registro diario de cosas positivas y afirmaciones.

CREATE TABLE IF NOT EXISTS public.gratitude_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    date date NOT NULL DEFAULT CURRENT_DATE,
    items jsonb NOT NULL DEFAULT '[]'::jsonb, -- Array de 3 cosas buenas
    affirmation text, -- Afirmación generada
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Asegurar un solo registro por día por usuario para mantener el hábito ordenado
ALTER TABLE public.gratitude_logs ADD CONSTRAINT unique_gratitude_date_per_user UNIQUE (user_id, date);

-- Habilitar RLS
ALTER TABLE public.gratitude_logs ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad
CREATE POLICY "Users can view own gratitude_logs" 
    ON gratitude_logs FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own gratitude_logs" 
    ON gratitude_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own gratitude_logs" 
    ON gratitude_logs FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own gratitude_logs" 
    ON gratitude_logs FOR DELETE USING (auth.uid() = user_id);
