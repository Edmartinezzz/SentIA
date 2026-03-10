-- Tabla para insignias coleccionables del usuario
CREATE TABLE IF NOT EXISTS public.user_badges (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    badge_type text NOT NULL, -- Ej: 'resilience', 'calm', 'self_care'
    badge_name text NOT NULL,
    reflective_message text NOT NULL,
    earned_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Users can view own badges" 
    ON user_badges FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own badges" 
    ON user_badges FOR INSERT 
    WITH CHECK (auth.uid() = user_id);
