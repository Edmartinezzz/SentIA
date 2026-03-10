"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Library, Music, Sparkles, BookOpen, ExternalLink, RefreshCw, Mic, Youtube, Calendar, MessageSquare } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Recommendation = {
    title: string;
    author?: string;
    artist?: string;
    reason: string;
    image_tag?: string;
};

type RecommendationsData = {
    books: Recommendation[];
    songs: Recommendation[];
    podcasts: Recommendation[];
};

export default function ResourcesPage() {
    const [data, setData] = useState<RecommendationsData | null>(null);
    const [loading, setLoading] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [conversations, setConversations] = useState<any[]>([]);
    const [selectedConvId, setSelectedConvId] = useState<string>("");

    useEffect(() => {
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            const id = session?.user?.id ?? null;
            setUserId(id);

            if (id) {
                const { data: convs } = await supabase
                    .from("conversations")
                    .select("*")
                    .eq("user_id", id)
                    .order("created_at", { ascending: false })
                    .limit(10);
                setConversations(convs || []);
            } else {
                // MODO INVITADO: Cargar desde localStorage
                const stored = window.localStorage.getItem("SentIA_conversations");
                if (stored) {
                    setConversations(JSON.parse(stored));
                }
            }
        };
        getSession();
    }, []);

    const generateRecommendations = async () => {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();

            // Si es invitado, enviamos el contexto de los mensajes del chat seleccionado directamente
            let guestContext = "";
            if (!userId && selectedConvId) {
                const conv = conversations.find(c => c.id === selectedConvId);
                if (conv) {
                    guestContext = conv.messages.map((m: any) => `${m.role === 'user' ? 'Usuario' : 'SentIA'}: ${m.content}`).join("\n");
                }
            } else if (!userId) {
                // Todo el proceso de invitado
                guestContext = conversations.flatMap(c => c.messages || []).map((m: any) => `${m.role === 'user' ? 'Usuario' : 'SentIA'}: ${m.content}`).slice(-20).join("\n");
            }

            const response = await fetch("/api/recommendations", {
                method: "POST",
                headers: {
                    "Authorization": session?.access_token ? `Bearer ${session.access_token}` : "",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    userId: userId || "guest",
                    conversationId: userId ? selectedConvId : null,
                    context: guestContext
                }),
            });

            const result = await response.json();
            if (result.error && !result.books) throw new Error(result.error);

            setData(result);
            localStorage.setItem(`SentIA_recs_${userId}`, JSON.stringify(result));
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (userId) {
            const cached = localStorage.getItem(`SentIA_recs_${userId}`);
            if (cached) setData(JSON.parse(cached));
        }
    }, [userId]);

    const getSearchUrl = (type: 'book' | 'song' | 'podcast' | 'youtube', item: Recommendation) => {
        const query = encodeURIComponent(`${item.title} ${item.author || item.artist || ""}`);
        if (type === 'book') return `https://www.google.com/search?q=${query}+libro`;
        if (type === 'song') return `https://open.spotify.com/search/${query}`;
        if (type === 'youtube') return `https://www.youtube.com/results?search_query=${query}`;
        return `https://www.google.com/search?q=${query}+podcast`;
    };

    const renderImage = (rec: Recommendation, index: number, colorClass: string) => {
        return (
            <div className={`relative h-32 w-full overflow-hidden rounded-t-2xl bg-slate-100 dark:bg-slate-800`}>
                <img
                    src={`https://loremflickr.com/400/200/${rec.image_tag || 'nature'}?lock=${index}`}
                    alt={rec.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60"></div>
            </div>
        );
    };

    return (
        <div className="flex h-full flex-col gap-8 bg-background px-4 py-8 text-on-surface md:px-10 overflow-y-auto scrollbar-hide relative">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between relative z-10">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight text-primary">Recursos para ti</h1>
                    <p className="mt-2 text-[16px] font-medium text-on-surface-variant">
                        Selecciona un chat para que SentIA analice esa necesidad específica.
                    </p>
                </div>
                <button
                    onClick={generateRecommendations}
                    disabled={loading}
                    className="group inline-flex items-center gap-2 rounded-full bg-primary px-8 py-4 text-sm font-bold text-on-primary shadow-sm transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                >
                    {loading ? (
                        <RefreshCw className="h-5 w-5 animate-spin" />
                    ) : (
                        <Sparkles className="h-5 w-5" />
                    )}
                    {data ? "Actualizar" : "Generar Recomendaciones"}
                </button>
            </div>

            <div className="flex flex-col gap-4 relative z-10">
                <label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.15em] text-secondary">
                    <MessageSquare className="h-4 w-4" />
                    Basar análisis en:
                </label>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setSelectedConvId("")}
                        className={`group flex items-center gap-2 rounded-full border px-6 py-2.5 text-sm font-bold transition-all ${selectedConvId === ""
                            ? "bg-secondary-container text-on-secondary-container border-transparent shadow-sm"
                            : "border-outline text-on-surface-variant hover:bg-surface-variant/30"
                            }`}
                    >
                        <Sparkles className={`h-4 w-4 ${selectedConvId === "" ? "text-primary" : "opacity-40"}`} />
                        Todo mi proceso
                    </button>
                    {conversations.map((conv) => (
                        <button
                            key={conv.id}
                            onClick={() => setSelectedConvId(conv.id)}
                            className={`flex items-center gap-2 rounded-full border px-6 py-2.5 text-sm font-bold transition-all ${selectedConvId === conv.id
                                ? "bg-secondary-container text-on-secondary-container border-transparent shadow-sm"
                                : "border-outline text-on-surface-variant hover:bg-surface-variant/30"
                                }`}
                        >
                            <Calendar className="h-4 w-4 opacity-40" />
                            <span className="max-w-[150px] truncate">{conv.title}</span>
                        </button>
                    ))}
                </div>
            </div>

            {!data && !loading ? (
                <div className="flex flex-1 flex-col items-center justify-center rounded-[32px] bg-surface-container-low border border-outline/5 p-12 text-center">
                    <div className="mb-6 rounded-[24px] bg-secondary-container p-6 text-on-secondary-container">
                        <Library className="h-10 w-10" />
                    </div>
                    <h2 className="text-xl font-bold text-on-surface">Aún no hay recomendaciones</h2>
                    <p className="mt-2 text-sm text-on-surface-variant max-w-xs">
                        Haz clic en el botón superior después de elegir un chat para recibir ayuda específica.
                    </p>
                </div>
            ) : (
                <div className="space-y-12 pb-10">
                    <section>
                        <div className="mb-6 flex items-center gap-3 text-primary">
                            <BookOpen className="h-6 w-6" />
                            <h2 className="font-bold uppercase tracking-wider text-sm">Lecturas para el alma</h2>
                        </div>
                        <div className="grid gap-6 md:grid-cols-3">
                            <AnimatePresence mode="popLayout">
                                {(loading ? [1, 2, 3] : data?.books || []).map((book: any, i) => (
                                    <motion.div
                                        key={loading ? `skeleton-b-${i}` : (book.title + i)}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`group relative flex flex-col rounded-[32px] bg-surface-container shadow-sm transition-all overflow-hidden ${loading ? 'animate-pulse' : ''}`}
                                    >
                                        {loading ? (
                                            <div className="space-y-3">
                                                <div className="h-40 w-full bg-surface-variant"></div>
                                                <div className="p-6">
                                                    <div className="h-5 w-3/4 bg-surface-variant rounded-full"></div>
                                                    <div className="h-4 w-1/2 bg-surface-variant rounded-full mt-3"></div>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                {renderImage(book, i, "bg-primary")}
                                                <div className="p-6">
                                                    <h3 className="text-lg font-bold line-clamp-1 text-on-surface">{book.title}</h3>
                                                    <p className="mt-1 text-sm text-on-surface-variant font-medium">{book.author}</p>
                                                    <div className="mt-4 rounded-2xl bg-surface-container-high p-4 text-[13px] leading-relaxed text-on-surface-variant font-medium">
                                                        {book.reason}
                                                    </div>
                                                    <a
                                                        href={getSearchUrl('book', book)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="mt-6 flex items-center justify-center gap-2 rounded-full border border-outline py-3 text-sm font-bold text-primary hover:bg-primary/5 transition-colors"
                                                    >
                                                        <ExternalLink className="h-4 w-4" />
                                                        Buscar Libro
                                                    </a>
                                                </div>
                                            </>
                                        )}
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </section>

                    <section>
                        <div className="mb-6 flex items-center gap-3 text-secondary">
                            <Mic className="h-6 w-6" />
                            <h2 className="font-bold uppercase tracking-wider text-sm">Podcasts sugeridos</h2>
                        </div>
                        <div className="grid gap-6 md:grid-cols-3">
                            <AnimatePresence mode="popLayout">
                                {(loading ? [1, 2, 3] : data?.podcasts || []).map((podcast: any, i) => (
                                    <motion.div
                                        key={loading ? `skeleton-p-${i}` : (podcast.title + i)}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`group relative flex flex-col rounded-[32px] bg-surface-container shadow-sm transition-all overflow-hidden ${loading ? 'animate-pulse' : ''}`}
                                    >
                                        {loading ? (
                                            <div className="space-y-3">
                                                <div className="h-40 w-full bg-surface-variant"></div>
                                                <div className="p-6">
                                                    <div className="h-5 w-3/4 bg-surface-variant rounded-full"></div>
                                                    <div className="h-4 w-1/2 bg-surface-variant rounded-full mt-3"></div>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                {renderImage(podcast, i + 3, "bg-secondary")}
                                                <div className="p-6">
                                                    <h3 className="text-lg font-bold line-clamp-1 text-on-surface">{podcast.title}</h3>
                                                    <p className="mt-1 text-sm text-on-surface-variant font-medium">{podcast.author}</p>
                                                    <div className="mt-4 rounded-2xl bg-surface-container-high p-4 text-[13px] leading-relaxed text-on-surface-variant font-medium">
                                                        {podcast.reason}
                                                    </div>
                                                    <a
                                                        href={getSearchUrl('podcast', podcast)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="mt-6 flex items-center justify-center gap-2 rounded-full bg-secondary text-on-secondary py-3 text-sm font-bold hover:brightness-105 transition-all shadow-sm"
                                                    >
                                                        <Mic className="h-4 w-4" />
                                                        Escuchar ahora
                                                    </a>
                                                </div>
                                            </>
                                        )}
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </section>

                    <section>
                        <div className="mb-6 flex items-center gap-3 text-tertiary">
                            <Music className="h-6 w-6" />
                            <h2 className="font-bold uppercase tracking-wider text-sm">Melodías de apoyo</h2>
                        </div>
                        <div className="grid gap-6 md:grid-cols-3">
                            <AnimatePresence mode="popLayout">
                                {(loading ? [1, 2, 3] : data?.songs || []).map((song: any, i) => (
                                    <motion.div
                                        key={loading ? `skeleton-s-${i}` : (song.title + i)}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`group relative flex flex-col rounded-[32px] bg-surface-container shadow-sm transition-all overflow-hidden ${loading ? 'animate-pulse' : ''}`}
                                    >
                                        {loading ? (
                                            <div className="space-y-3">
                                                <div className="h-40 w-full bg-surface-variant"></div>
                                                <div className="p-6">
                                                    <div className="h-5 w-3/4 bg-surface-variant rounded-full"></div>
                                                    <div className="h-4 w-1/2 bg-surface-variant rounded-full mt-3"></div>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                {renderImage(song, i + 6, "bg-tertiary")}
                                                <div className="p-6">
                                                    <h3 className="text-lg font-bold line-clamp-1 text-on-surface">{song.title}</h3>
                                                    <p className="mt-1 text-sm text-on-surface-variant font-medium">{song.artist}</p>
                                                    <div className="mt-4 rounded-2xl bg-surface-container-high p-4 text-[13px] leading-relaxed text-on-surface-variant font-medium">
                                                        {song.reason}
                                                    </div>
                                                    <div className="mt-6 grid grid-cols-2 gap-3">
                                                        <a
                                                            href={getSearchUrl('song', song)}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center justify-center gap-2 rounded-full bg-tertiary text-on-tertiary py-3 text-[12px] font-bold hover:brightness-105 transition-all shadow-sm"
                                                        >
                                                            <Music className="h-4 w-4" />
                                                            Spotify
                                                        </a>
                                                        <a
                                                            href={getSearchUrl('youtube', song)}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center justify-center gap-2 rounded-full border border-outline py-3 text-[12px] font-bold text-on-surface-variant hover:bg-surface-variant/30 transition-all"
                                                        >
                                                            <Youtube className="h-4 w-4 text-error" />
                                                            YouTube
                                                        </a>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
}

