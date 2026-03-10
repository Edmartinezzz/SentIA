"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { User, Mail, LogOut } from "lucide-react";

type Profile = {
  full_name: string | null;
  email: string | null;
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error" | "saving" | "success">(
    "idle",
  );
  const [newName, setNewName] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();

      setProfile({
        full_name: profileData?.full_name ?? null,
        email: user.email ?? null,
      });
      setNewName(profileData?.full_name ?? "");
    };

    loadProfile();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("saving");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        full_name: newName,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error("Error updating profile:", error);
      setStatus("error");
      setErrorMessage("No se pudo actualizar el perfil. Intenta de nuevo.");
      return;
    }

    setProfile(prev => prev ? { ...prev, full_name: newName } : null);
    setStatus("success");
    setTimeout(() => setStatus("idle"), 3000);
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage(null);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin + "/chat/profile",
      },
    });

    if (error) {
      setStatus("error");
      setErrorMessage(
        "No se pudo enviar el enlace. Verifica el correo o intenta más tarde.",
      );
      return;
    }

    setStatus("sent");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  return (
    <div className="flex h-full flex-col gap-10 bg-background px-4 py-8 text-on-surface md:px-10 overflow-y-auto scrollbar-hide">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-primary">Tu espacio</h1>
        <p className="mt-2 text-[16px] text-on-surface-variant font-medium max-w-2xl">
          Gestiona tu perfil y el acceso seguro a Clarity. Recuerda que esta
          herramienta no sustituye a un profesional de la salud mental.
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid gap-8 md:grid-cols-2 lg:max-w-6xl pb-10"
      >
        <div className="rounded-[32px] bg-surface-container p-8 shadow-sm border border-outline/5 overflow-hidden relative group">
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-primary-container text-primary">
              <User className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-on-surface">Perfil emocional</h2>
              <p className="text-[13px] text-on-surface-variant font-medium">
                Un resumen suave de quién eres dentro de Clarity.
              </p>
            </div>
          </div>

          {profile ? (
            <div className="mt-4 space-y-6">
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="fullName" className="text-[13px] font-bold uppercase tracking-widest text-secondary ml-1">
                    Nombre completo
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Tu nombre completo"
                    className="w-full rounded-2xl bg-surface-container-high px-5 py-4 text-[16px] font-medium text-on-surface outline-none border border-outline/10 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all placeholder:opacity-30"
                  />
                </div>

                <div className="space-y-1 ml-1">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant opacity-60">Correo vinculado</p>
                  <p className="text-[16px] font-bold text-on-surface">{profile.email}</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={status === "saving"}
                    className="inline-flex flex-1 items-center justify-center rounded-full bg-primary px-8 py-4 text-sm font-bold text-on-primary shadow-lg hover:brightness-105 transition-all disabled:opacity-50"
                  >
                    {status === "saving" ? "Guardando..." : "Guardar cambios"}
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-outline px-8 py-4 text-sm font-bold text-on-surface-variant hover:bg-surface-variant/30 transition-all"
                  >
                    <LogOut className="h-4 w-4" />
                    Cerrar sesión
                  </button>
                </div>

                {status === "success" && (
                  <p className="text-center text-[13px] font-bold text-primary mt-2">
                    ¡Perfil actualizado correctamente!
                  </p>
                )}
              </form>
            </div>
          ) : (
            <div className="py-8 text-center bg-surface-container-low rounded-3xl border border-dashed border-outline/20">
              <p className="text-sm font-bold text-on-surface-variant uppercase tracking-widest px-8">
                Inicia sesión para personalizar tu experiencia y guardar tu
                historial de conversaciones y progreso emocional.
              </p>
            </div>
          )}
        </div>

        <div className="rounded-[32px] bg-surface-container p-8 shadow-sm border border-outline/5 overflow-hidden relative group">
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-secondary-container text-secondary">
              <Mail className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-on-surface">
                Acceso con enlace mágico
              </h2>
              <p className="text-[13px] text-on-surface-variant font-medium">
                Te enviaremos un enlace seguro a tu correo.
              </p>
            </div>
          </div>

          <form onSubmit={handleMagicLink} className="mt-4 space-y-6">
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-[13px] font-bold uppercase tracking-widest text-secondary ml-1"
              >
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl bg-surface-container-high px-5 py-4 text-[16px] font-medium text-on-surface outline-none border border-outline/10 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all placeholder:opacity-30"
                placeholder="tucorreo@ejemplo.com"
              />
            </div>

            <button
              type="submit"
              disabled={status === "loading"}
              className="inline-flex w-full items-center justify-center rounded-full bg-secondary px-8 py-4 text-sm font-bold text-on-secondary shadow-lg hover:brightness-105 transition-all disabled:opacity-50"
            >
              {status === "loading"
                ? "Enviando enlace..."
                : "Enviar enlace de acceso"}
            </button>

            {status === "sent" && (
              <div className="p-4 rounded-2xl bg-primary-container/20 border border-primary-container/30">
                <p className="text-[13px] font-bold text-primary text-center">
                  Te hemos enviado un enlace de inicio de sesión. Revisa tu
                  bandeja de entrada.
                </p>
              </div>
            )}

            {status === "error" && errorMessage && (
              <p className="text-[13px] font-bold text-error text-center">
                {errorMessage}
              </p>
            )}

            <div className="pt-4 border-t border-outline/5">
              <p className="text-[11px] leading-relaxed text-on-surface-variant font-medium opacity-60 text-center uppercase tracking-tighter italic">
                Asegúrate de configurar las variables de entorno de Supabase para habilitar el acceso seguro.
              </p>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

