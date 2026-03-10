-- Migración para Registro de Sueño (Clarity v4.0)
-- Descripción: Tabla para que los usuarios registren sus horas y calidad de sueño.

CREATE TABLE IF NOT EXISTS public.sleep_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    date date NOT NULL DEFAULT CURRENT_DATE,
    hours numeric(4, 2) NOT NULL CHECK (hours >= 0 AND hours <= 24),
    quality text NOT NULL CHECK (quality IN ('poor', 'fair', 'good', 'excellent')),
    observations text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Asegurar un solo registro por día por usuario
ALTER TABLE public.sleep_logs ADD CONSTRAINT unique_sleep_date_per_user UNIQUE (user_id, date);

-- Habilitar RLS
ALTER TABLE public.sleep_logs ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad
CREATE POLICY "Users can view own sleep_logs" 
    ON sleep_logs FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sleep_logs" 
    ON sleep_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sleep_logs" 
    ON sleep_logs FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sleep_logs" 
    ON sleep_logs FOR DELETE USING (auth.uid() = user_id);
