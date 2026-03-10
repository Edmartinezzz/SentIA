-- Tabla para recomendaciones de progreso (Actividades y Alimentos)
CREATE TABLE IF NOT EXISTS public.progress_recommendations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    content text NOT NULL,
    category text NOT NULL CHECK (category IN ('activity', 'food')),
    completed boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.progress_recommendations ENABLE ROW LEVEL SECURITY;

-- Políticas de Seguridad
CREATE POLICY "Users can view own recommendations" 
    ON progress_recommendations FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recommendations" 
    ON progress_recommendations FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recommendations" 
    ON progress_recommendations FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own recommendations" 
    ON progress_recommendations FOR DELETE 
    USING (auth.uid() = user_id);
