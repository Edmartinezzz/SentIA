"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, User, Sparkles, Clock3, Plus, Trash2, Edit2, Check, X, Mic, MicOff, Volume2, VolumeX, Loader2, HeartPulse } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAudio, ALL_SOUNDS } from "@/lib/audio-context";

type ChatMessage = {
    id: string;
    role: "user" | "assistant";
    content: string;
    created_at?: string;
};

type Conversation = {
    id: string;
    title: string;
    createdAt: string;
    updatedAt: string;
    messages: ChatMessage[];
};

export default function ChatPage() {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [userName, setUserName] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState("");
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [ttsEnabled, setTtsEnabled] = useState(false);
    const [micPermission, setMicPermission] = useState<'unknown' | 'granted' | 'denied'>('unknown');
    const [sttSupported, setSttSupported] = useState(true);
    const [latestMood, setLatestMood] = useState<string | null>(null);
    const [showMobileHistory, setShowMobileHistory] = useState(false);

    const { suggestSound, suggestedSoundId, playSound, clearSuggestion } = useAudio();

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const recognitionRef = useRef<any>(null);

    // Inicializar Voz (v3.0)
    useEffect(() => {
        if (typeof window !== "undefined") {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (!SpeechRecognition) {
                setSttSupported(false);
                return;
            }

            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = "es-ES";

            recognitionRef.current.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setInput(transcript);
                setIsListening(false);
            };

            recognitionRef.current.onerror = (e: any) => {
                console.error("🎙️ STT Error type:", e.error, "| Full event:", e);
                setIsListening(false);
                if (e.error === 'not-allowed' || e.error === 'permission-denied') {
                    setMicPermission('denied');
                }
            };
            recognitionRef.current.onstart = () => {
                console.log("🎙️ STT started successfully");
                setMicPermission('granted');
            };
            recognitionRef.current.onend = () => {
                console.log("🎙️ STT ended");
                setIsListening(false);
            };
        }
    }, []);

    const toggleListening = () => {
        if (!recognitionRef.current) return;

        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
            return;
        }

        setMicPermission('unknown');
        recognitionRef.current.start();
        setIsListening(true);
    };

    const speak = (text: string) => {
        if (!ttsEnabled || typeof window === "undefined") return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "es-ES";
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
    };

    // Obtener sesión de usuario y perfil
    useEffect(() => {
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            const id = session?.user?.id ?? null;
            setUserId(id);

            if (id) {
                // Sincronizar con profiles
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("full_name")
                    .eq("id", id)
                    .maybeSingle();
                setUserName(profile?.full_name ?? null);

                const { data: emo } = await supabase
                    .from("emotion_logs")
                    .select("mood, intensity")
                    .eq("user_id", id)
                    .order("created_at", { ascending: false })
                    .limit(1)
                    .maybeSingle();
                if (emo) setLatestMood(emo.mood);
            }
        };
        getSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            const id = session?.user?.id ?? null;
            setUserId(id);

            if (id) {
                if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
                    // Cargar perfil
                    const { data: profile } = await supabase
                        .from("profiles")
                        .select("full_name")
                        .eq("id", id)
                        .maybeSingle();
                    setUserName(profile?.full_name ?? null);
                }
            } else {
                setUserName(null);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    // Ref para evitar recargas infinitas si el ID no ha cambiado
    const lastLoadedId = useRef<string | null>(null);

    // Cargar mensajes de la conversación activa
    useEffect(() => {
        const loadMessages = async () => {
            if (activeConversationId === lastLoadedId.current && messages.length > 0) return;

            if (!activeConversationId) {
                lastLoadedId.current = null;
                if (userId && !userName) {
                    setMessages([
                        {
                            id: "onboarding",
                            role: "assistant",
                            content: "¡Hola! Soy SentIA, tu asistente de bienestar personal. ✨ ¿Cómo te llamas?",
                            created_at: new Date().toISOString()
                        } as ChatMessage
                    ]);
                } else {
                    setMessages([]);
                }
                return;
            }

            lastLoadedId.current = activeConversationId;

            if (userId) {
                const { data, error } = await supabase
                    .from("messages")
                    .select("*")
                    .eq("conversation_id", activeConversationId)
                    .order("created_at", { ascending: true });

                if (!error) setMessages(data || []);
            } else {
                const conv = conversations.find((c) => c.id === activeConversationId);
                setMessages(conv?.messages || []);
            }
        };

        loadMessages();
    }, [activeConversationId, userId, userName]);

    const loadHistory = async (uid: string | null) => {
        if (uid) {
            const { data: convs, error } = await supabase
                .from("conversations")
                .select(`
                    id, 
                    title, 
                    created_at,
                    messages (id, role, content, created_at)
                `)
                .order("created_at", { ascending: false });

            if (!error && convs) {
                const formattedConvs: Conversation[] = convs.map(c => ({
                    id: c.id,
                    title: c.title,
                    createdAt: c.created_at,
                    updatedAt: c.created_at,
                    messages: (c.messages as any[] ?? []).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                }));
                setConversations(formattedConvs);
                if (formattedConvs.length > 0 && !activeConversationId) {
                    setActiveConversationId(formattedConvs[0].id);
                }
            }
        } else {
            const stored = window.localStorage.getItem("SentIA_conversations");
            if (stored) {
                try {
                    const parsed: Conversation[] = JSON.parse(stored);
                    setConversations(parsed);
                    if (parsed.length > 0 && !activeConversationId) {
                        setActiveConversationId(parsed[0].id);
                    }
                } catch { }
            }
        }
    };

    useEffect(() => {
        loadHistory(userId);
    }, [userId]);

    useEffect(() => {
        if (!userId && conversations.length > 0) {
            const timer = setTimeout(() => {
                localStorage.setItem("SentIA_conversations", JSON.stringify(conversations));
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [conversations, userId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSelectConversation = (conversation: Conversation) => {
        setActiveConversationId(conversation.id);
        setMessages(conversation.messages);
    };

    const handleNewConversation = () => {
        setActiveConversationId(null);
        setMessages([]);
    };

    const handleDeleteConversation = async (id: string) => {
        if (!confirm("¿Borrar esta conversación?")) return;
        if (userId) await supabase.from("conversations").delete().eq("id", id);
        setConversations(prev => prev.filter(c => c.id !== id));
        if (activeConversationId === id) handleNewConversation();
    };

    const handleSaveRename = async (id: string) => {
        const title = editTitle.trim();
        if (!title) return;
        if (userId) await supabase.from("conversations").update({ title }).eq("id", id);
        setConversations(prev => prev.map(c => c.id === id ? { ...c, title } : c));
        setEditingId(null);
    };

    return (
        <div className="flex flex-col md:flex-row h-full w-full relative overflow-hidden bg-background">

            {/* Cabecera Móvil (Solo visible en pantallas pequeñas) */}
            <div className="xl:hidden flex items-center justify-between px-4 py-3 bg-surface-container/30 backdrop-blur-md border-b border-outline/5 z-20 shrink-0">
                <button
                    onClick={() => setShowMobileHistory(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-secondary-container/40 hover:bg-secondary-container/60 text-secondary font-bold rounded-2xl transition-colors"
                >
                    <Clock3 className="h-4 w-4" />
                    <span className="text-sm">Historial de Chats</span>
                </button>
                <button
                    onClick={handleNewConversation}
                    className="p-3 bg-primary text-on-primary rounded-2xl shadow-sm hover:scale-105 active:scale-95 transition-all"
                >
                    <Plus className="h-5 w-5" />
                </button>
            </div>

            {/* Panel Lateral Móvil para Historial */}
            <AnimatePresence>
                {showMobileHistory && (
                    <motion.div
                        initial={{ x: "-100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "-100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="absolute inset-0 z-50 bg-background flex flex-col xl:hidden"
                    >
                        <div className="p-6 flex items-center justify-between bg-surface-container-low border-b border-outline/5 shrink-0">
                            <div className="flex items-center gap-3">
                                <Clock3 className="h-5 w-5 text-secondary" />
                                <span className="text-sm font-bold uppercase tracking-widest text-on-surface-variant">Historial</span>
                            </div>
                            <button onClick={() => setShowMobileHistory(false)} className="p-2 rounded-full bg-surface-variant/50 text-on-surface hover:bg-surface-variant transition-colors">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="p-4 space-y-3 overflow-y-auto flex-1 bg-surface-container-low pb-24">
                            {conversations.length === 0 ? (
                                <p className="text-center text-sm font-medium text-on-surface-variant mt-10">No hay conversaciones previas.</p>
                            ) : (
                                conversations.map((conv) => (
                                    <div key={conv.id} className="group relative">
                                        <button
                                            onClick={() => { handleSelectConversation(conv); setShowMobileHistory(false); }}
                                            className={`w-full text-left truncate rounded-[24px] px-5 py-4 text-[14px] font-bold transition-all ${conv.id === activeConversationId ? "bg-secondary-container text-on-secondary-container scale-[1.02]" : "bg-surface-container text-on-surface-variant border border-outline/5 hover:border-outline/20"}`}
                                        >
                                            {conv.title}
                                        </button>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-gradient-to-l from-surface-container via-surface-container to-transparent pl-4 py-1 rounded-r-[24px]">
                                            <button onClick={(e) => { e.stopPropagation(); setEditingId(conv.id); setEditTitle(conv.title); }} className="text-primary/70 hover:text-primary p-2"><Edit2 className="h-4 w-4" /></button>
                                            <button onClick={(e) => { e.stopPropagation(); handleDeleteConversation(conv.id); }} className="text-error/70 hover:text-error p-2"><Trash2 className="h-4 w-4" /></button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <main className="flex-1 flex flex-col h-full overflow-hidden relative z-10">
                <div className="flex-1 overflow-y-auto p-4 md:p-8 scrollbar-hide">
                    <div className="mx-auto max-w-3xl space-y-6">
                        {latestMood && ['sadness', 'anxiety', 'anger'].includes(latestMood) && (
                            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-primary-container/30 border border-primary/20 rounded-[2rem] p-5 my-2 flex items-center gap-4 shadow-sm">
                                <div className="h-12 w-12 shrink-0 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                                    <HeartPulse className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-[15px] font-bold text-on-surface">SentIA nota que has tenido momentos difíciles.</p>
                                    <p className="text-[13px] text-on-surface-variant font-medium mt-0.5">Respira profundo, estoy aquí para escucharte.</p>
                                </div>
                            </motion.div>
                        )}

                        {messages.length === 0 ? (
                            <div className="flex h-[60vh] flex-col items-center justify-center text-center">
                                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-[32px] bg-primary-container text-primary shadow-sm border border-primary-container/10">
                                    <Sparkles className="h-10 w-10" />
                                </div>
                                <h2 className="mb-2 text-3xl font-bold tracking-tight text-on-surface">¿Cómo te sientes hoy?</h2>
                                <p className="max-w-xs text-on-surface-variant font-medium leading-relaxed">Comparte tus pensamientos y busquemos claridad juntos.</p>
                            </div>
                        ) : (
                            <AnimatePresence initial={false}>
                                {messages.map((message: any) => (
                                    <motion.div key={message.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                                        <div className={`flex max-w-[85%] items-end gap-3 md:max-w-[80%] ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                                            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${message.role === "user" ? "bg-primary text-on-primary" : "bg-secondary-container text-on-secondary-container"}`}>
                                                {message.role === "user" ? <User className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
                                            </div>
                                            <div className={`group relative rounded-[2rem] px-6 py-4 text-[16px] leading-relaxed shadow-sm transition-all ${message.role === "user" ? "bg-primary text-on-primary rounded-br-none" : "bg-surface-container-high text-on-surface rounded-bl-none"}`}>
                                                <p className="whitespace-pre-wrap relative z-10 font-medium tracking-tight">{message.content}</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        )}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="flex max-w-[85%] items-end gap-3 md:max-w-[80%]">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-secondary-container text-on-secondary-container">
                                        <Sparkles className="animate-pulse h-5 w-5" />
                                    </div>
                                    <div className="bg-surface-container-high px-6 py-4 rounded-3xl rounded-bl-none shadow-sm flex gap-1.5">
                                        <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                                        <div className="h-2 w-2 rounded-full bg-primary animate-pulse delay-75" />
                                        <div className="h-2 w-2 rounded-full bg-primary animate-pulse delay-150" />
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </div>

                <div className="p-4 md:p-8 bg-background shrink-0">
                    <div className="mx-auto max-w-3xl relative">
                        <form
                            onSubmit={async (e) => {
                                e.preventDefault();
                                const content = input.trim();
                                if (!content || isLoading) return;

                                const userMessage: ChatMessage = { id: crypto.randomUUID(), role: "user", content, created_at: new Date().toISOString() };
                                const nextMessages = [...messages, userMessage];
                                setMessages(nextMessages);
                                setInput("");
                                setIsLoading(true);

                                try {
                                    let currentConvId = activeConversationId;
                                    if (!currentConvId) {
                                        currentConvId = crypto.randomUUID();
                                        if (userId) {
                                            const { data: nc } = await supabase.from("conversations").insert({ user_id: userId, title: content.slice(0, 40) }).select().single();
                                            if (nc) currentConvId = nc.id;
                                        }
                                        setActiveConversationId(currentConvId);
                                    }

                                    if (userId) await supabase.from("messages").insert({ conversation_id: currentConvId, role: "user", content });

                                    const brief = localStorage.getItem("SentIA_brief_responses") === "true";
                                    const action = localStorage.getItem("SentIA_action_focus") === "true";

                                    const { data: { session } } = await supabase.auth.getSession();
                                    const token = session?.access_token;

                                    const response = await fetch("/api/chat", {
                                        method: "POST",
                                        headers: {
                                            "Content-Type": "application/json",
                                            ...(token ? { "Authorization": `Bearer ${token}` } : {})
                                        },
                                        body: JSON.stringify({
                                            messages: nextMessages.map(m => ({ role: m.role, content: m.content })),
                                            userName,
                                            settings: { briefResponses: brief, actionFocus: action }
                                        }),
                                    });

                                    if (!response.ok) throw new Error();
                                    const assistantText = await response.text();

                                    const assistantMessage: ChatMessage = { id: crypto.randomUUID(), role: "assistant", content: assistantText, created_at: new Date().toISOString() };
                                    const finalMessages = [...nextMessages, assistantMessage];
                                    setMessages(finalMessages);

                                    if (userId) await supabase.from("messages").insert({ conversation_id: currentConvId, role: "assistant", content: assistantText });

                                    speak(assistantText);

                                    // Emotion Analysis and Sound Suggestion
                                    if (userId) {
                                        const { data: { session } } = await supabase.auth.getSession();
                                        const token = session?.access_token;
                                        const emotionResponse = await fetch("/api/emotions/analyze", {
                                            method: "POST",
                                            headers: { "Content-Type": "application/json", ...(token ? { "Authorization": `Bearer ${token}` } : {}) },
                                            body: JSON.stringify({ messages: finalMessages.slice(-10), conversationId: currentConvId, userId })
                                        }).catch(() => null);

                                        if (emotionResponse?.ok) {
                                            const emo = await emotionResponse.json();
                                            if (emo.analysis?.mood) suggestSound(emo.analysis.mood);
                                        }
                                    }

                                } catch (err) {
                                    console.error(err);
                                } finally {
                                    setIsLoading(false);
                                }
                            }}
                            className="flex items-end gap-2 p-1.5 md:p-2 bg-surface-container rounded-[2rem] md:rounded-[2.5rem] shadow-sm border border-outline/5 transition-all focus-within:ring-2 focus-within:ring-primary/20"
                        >
                            <div className="flex items-center gap-0.5 ml-1 md:ml-2 mb-1">
                                <button type="button" onClick={() => setTtsEnabled(!ttsEnabled)} className={`h-10 w-10 rounded-full flex items-center justify-center ${ttsEnabled ? 'bg-primary-container text-primary' : 'text-on-surface-variant hover:bg-surface-variant'}`}>
                                    {ttsEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                                </button>
                                {sttSupported && (
                                    <button type="button" onClick={toggleListening} className={`h-10 w-10 rounded-full flex items-center justify-center ${isListening ? 'bg-error-container text-error animate-pulse' : 'text-on-surface-variant hover:bg-surface-variant'}`}>
                                        {isListening ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                                    </button>
                                )}
                            </div>
                            <textarea
                                className="max-h-24 w-full resize-none border-0 bg-transparent px-2 py-3 text-[16px] text-on-surface focus:outline-none"
                                placeholder="Escribe un mensaje..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (input.trim()) e.currentTarget.closest("form")?.requestSubmit(); } }}
                                rows={1}
                            />
                            <button type="submit" disabled={!input.trim() || isLoading} className="h-10 w-10 md:h-14 md:w-14 shrink-0 rounded-full bg-primary text-on-primary flex items-center justify-center transition-all hover:scale-105 active:scale-95 disabled:opacity-30 mr-1 mb-1">
                                <Send className="h-5 w-5 md:h-6 md:w-6" />
                            </button>
                        </form>
                        <p className="mt-2 text-center text-[10px] uppercase font-bold tracking-widest text-on-surface-variant opacity-60">IA de apoyo emocional</p>
                    </div>
                </div>
            </main>

            <aside className="w-full hidden xl:flex md:w-80 shrink-0 md:h-full flex-col bg-surface-container-low border-l border-outline/5">
                <div className="p-6 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <Clock3 className="h-5 w-5 text-secondary" />
                            <span className="text-sm font-bold uppercase tracking-widest text-on-surface-variant">Historial</span>
                        </div>
                        <button onClick={handleNewConversation} className="p-3 rounded-2xl bg-primary-container text-primary hover:brightness-95"><Plus className="h-5 w-5" /></button>
                    </div>
                    <div className="space-y-2 overflow-y-auto flex-1 pr-2 scrollbar-hide">
                        {conversations.map((conv) => (
                            <div key={conv.id} className="group relative">
                                <button onClick={() => handleSelectConversation(conv)} className={`w-full text-left truncate rounded-[24px] px-5 py-4 text-[14px] font-bold transition-all ${conv.id === activeConversationId ? "bg-secondary-container text-on-secondary-container scale-[1.02]" : "text-on-surface-variant hover:bg-surface-variant/50"}`}>
                                    {conv.title}
                                </button>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => { setEditingId(conv.id); setEditTitle(conv.title); }} className="hover:text-primary"><Edit2 className="h-4 w-4" /></button>
                                    <button onClick={() => handleDeleteConversation(conv.id)} className="hover:text-error"><Trash2 className="h-4 w-4" /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </aside>

            <AnimatePresence>
                {suggestedSoundId && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-primary-container text-on-primary-container rounded-full shadow-lg border border-primary/20 flex items-center gap-3 backdrop-blur-md">
                        <span className="text-xs font-bold uppercase tracking-wider">Sugerencia:</span>
                        <span className="text-sm font-medium">¿Te gustaría escuchar {ALL_SOUNDS.find(s => s.id === suggestedSoundId)?.name}?</span>
                        <div className="flex gap-2 ml-2">
                            <button onClick={() => { const s = ALL_SOUNDS.find(x => x.id === suggestedSoundId); if (s) playSound(s); clearSuggestion(); }} className="px-3 py-1 bg-primary text-on-primary rounded-full text-xs font-bold">Sí, por favor</button>
                            <button onClick={clearSuggestion} className="px-3 py-1 bg-surface-variant/50 text-on-surface-variant rounded-full text-xs font-bold">No</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

