import {
    MessageSquare,
    Settings,
    Activity,
    User,
    Wind,
    Library,
    Award,
    PencilLine,
    Headphones
} from "lucide-react";

export const navItems = [
    { name: "Chat", href: "/chat", icon: MessageSquare },
    { name: "Bienestar", href: "/chat/wellbeing", icon: Wind },
    { name: "Diario", href: "/chat/journal", icon: PencilLine },
    { name: "Sonidos", href: "/chat/sounds", icon: Headphones },
    { name: "Recursos", href: "/chat/resources", icon: Library },
    { name: "Progreso", href: "/chat/progress", icon: Activity },
    { name: "Insignias", href: "/chat/badges", icon: Award },
    { name: "Perfil", href: "/chat/profile", icon: User },
    { name: "Ajustes", href: "/chat/settings", icon: Settings }, // Renamed from Configuración to Ajustes to fit mobile better natively
];

