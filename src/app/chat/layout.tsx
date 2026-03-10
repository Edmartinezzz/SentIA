import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import { ClientLiquidBackground } from "@/components/layout/ClientLiquidBackground";

export default function ChatLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col md:flex-row h-screen w-full overflow-hidden relative bg-background">
            <ClientLiquidBackground />
            <Sidebar />

            <main className="flex-1 flex flex-col relative w-full h-full p-2 pb-[80px] md:pb-4 md:p-4">
                <div className="flex-1 overflow-y-auto">
                    {children}
                </div>
            </main>

            <BottomNav />
        </div>
    );
}

