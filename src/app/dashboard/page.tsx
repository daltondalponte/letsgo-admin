"use client";
import { useAuth } from "@/context/authContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Dashboard() {
    const { user, isAuthenticated, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (loading) return;
        if (!isAuthenticated) {
            router.push("/auth/signin");
        } else if (user?.type === "MASTER") {
            router.push("/dashboard/master");
        }
    }, [isAuthenticated, user, router, loading]);

    if (loading || !isAuthenticated || user?.type === "MASTER") {
        return null;
    }

    return (
        <main className="flex w-full flex-col items-center justify-start p-24 bg-theme-primary">
            <div className="w-full max-w-6xl">
                <h1 className="text-3xl font-bold mb-8 text-theme-primary">Dashboard Profissional</h1>
                <p className="text-lg mb-6 text-theme-secondary">Bem-vindo, {user?.name}!</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-theme-secondary p-6 rounded-lg border border-theme-primary shadow-theme-primary">
                        <h2 className="text-xl font-semibold mb-4 text-theme-primary">Meus Eventos</h2>
                        <p className="text-theme-secondary">Gerencie seus eventos criados</p>
                        <a href="/dashboard/eventos" className="text-[#FF6600] hover:text-[#d45500] mt-2 inline-block font-medium transition-colors">
                            Ver eventos →
                        </a>
                    </div>
                    
                    <div className="bg-theme-secondary p-6 rounded-lg border border-theme-primary shadow-theme-primary">
                        <h2 className="text-xl font-semibold mb-4 text-theme-primary">Cupons</h2>
                        <p className="text-theme-secondary">Crie e gerencie cupons de desconto</p>
                        <a href="/dashboard/cupons" className="text-[#FF6600] hover:text-[#d45500] mt-2 inline-block font-medium transition-colors">
                            Gerenciar cupons →
                        </a>
                    </div>
                    
                    <div className="bg-theme-secondary p-6 rounded-lg border border-theme-primary shadow-theme-primary">
                        <h2 className="text-xl font-semibold mb-4 text-theme-primary">Relatórios</h2>
                        <p className="text-theme-secondary">Visualize relatórios de vendas</p>
                        <a href="/dashboard/relatorios" className="text-[#FF6600] hover:text-[#d45500] mt-2 inline-block font-medium transition-colors">
                            Ver relatórios →
                        </a>
                    </div>
                </div>
            </div>
        </main>
    )
}

// TODO: Integrar com contexto de autenticação (useAuth) em Client Component