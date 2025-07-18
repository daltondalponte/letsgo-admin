"use client";
import { useAuth } from "@/context/authContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import ProfessionalDashboardStats from "@/components/ProfessionalDashboard/ProfessionalDashboardStats";

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

    const getUserTypeLabel = () => {
        switch (user?.type) {
            case 'PROFESSIONAL_OWNER':
                return 'Proprietário';
            case 'PROFESSIONAL_PROMOTER':
                return 'Promoter';
            default:
                return 'Profissional';
        }
    };

    return (
        <div className="flex flex-col w-full h-full">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-theme-primary">Dashboard {getUserTypeLabel()}</h1>
                <p className="text-lg text-theme-secondary mt-2">Bem-vindo, {user?.name}!</p>
                <p className="text-sm text-theme-tertiary mt-1">
                    {user?.type === 'PROFESSIONAL_OWNER' 
                        ? 'Gerencie seus estabelecimentos e eventos'
                        : 'Monitore seus eventos e vendas'
                    }
                </p>
            </div>
            
            {/* Estatísticas Personalizadas */}
            <ProfessionalDashboardStats />
            
            {/* Cards de Navegação */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                <div className="bg-theme-secondary p-6 rounded-lg border border-theme-primary shadow-theme-primary hover:shadow-lg transition-all duration-300">
                    <h2 className="text-xl font-semibold mb-4 text-theme-primary">🎭 Meus Eventos</h2>
                    <p className="text-theme-secondary mb-4">
                        {user?.type === 'PROFESSIONAL_OWNER' 
                            ? 'Gerencie eventos dos seus estabelecimentos'
                            : 'Crie e gerencie seus eventos promocionais'
                        }
                    </p>
                    <a href="/dashboard/eventos" className="text-[#FF6600] hover:text-[#d45500] font-medium transition-colors flex items-center gap-2">
                        Ver eventos 
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </a>
                </div>
                
                <div className="bg-theme-secondary p-6 rounded-lg border border-theme-primary shadow-theme-primary hover:shadow-lg transition-all duration-300">
                    <h2 className="text-xl font-semibold mb-4 text-theme-primary">🎫 Cupons</h2>
                    <p className="text-theme-secondary mb-4">Crie cupons de desconto para aumentar suas vendas</p>
                    <a href="/dashboard/cupons" className="text-[#FF6600] hover:text-[#d45500] font-medium transition-colors flex items-center gap-2">
                        Gerenciar cupons 
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </a>
                </div>
                
                <div className="bg-theme-secondary p-6 rounded-lg border border-theme-primary shadow-theme-primary hover:shadow-lg transition-all duration-300">
                    <h2 className="text-xl font-semibold mb-4 text-theme-primary">📊 Relatórios</h2>
                    <p className="text-theme-secondary mb-4">Visualize relatórios detalhados de vendas e performance</p>
                    <a href="/dashboard/relatorios" className="text-[#FF6600] hover:text-[#d45500] font-medium transition-colors flex items-center gap-2">
                        Ver relatórios 
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </a>
                </div>
            </div>
        </div>
    );
}