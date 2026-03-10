"use client";

import dynamic from "next/dynamic";

// Envoltorio explícito de Client Component para evitar el error de Server Component en layout.tsx
export const ClientLiquidBackground = dynamic(
    () => import("@/components/layout/LiquidBackground").then((mod) => mod.LiquidBackground),
    { ssr: false }
);
