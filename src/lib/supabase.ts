import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper para crear esquema en SQL Editor de Supabase (solo referencia para el usuario)
export const schemaInstructions = `
/* 
  Ejecuta este SQL en el SQL Editor de tu proyecto Supabase 
  para crear las tablas necesarias para Clarity.
*/

-- Tabla de Usuarios (extendiendo auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Tabla de Conversaciones
CREATE TABLE public.conversations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  title TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Tabla de Mensajes
CREATE TABLE public.messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Configuración de Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Usuarios pueden ver su propio perfil." ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Usuarios pueden actualizar su propio perfil." ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Usuarios pueden ver sus conversaciones." ON public.conversations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuarios pueden crear conversaciones." ON public.conversations FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden ver los mensajes de sus conversaciones." ON public.messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.conversations c WHERE c.id = messages.conversation_id AND c.user_id = auth.uid()
  )
);
CREATE POLICY "Usuarios pueden insertar mensajes en sus conversaciones." ON public.messages FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.conversations c WHERE c.id = messages.conversation_id AND c.user_id = auth.uid()
  )
);
`;
