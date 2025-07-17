"use client";
import { useAuth } from "@/context/authContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import MasterDashboardStats from "@/components/MasterDashboard/MasterDashboardStats";

export default function MasterPage() {
    const { user, isAuthenticated, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            if (!isAuthenticated) {
                router.push("/auth/signin");
            } else if (user?.type !== "MASTER") {
                router.push("/dashboard");
            }
        }
    }, [isAuthenticated, user, router, loading]);

    if (loading) {
        return <div className="flex items-center justify-center h-screen text-lg">Carregando...</div>;
    }
    if (!isAuthenticated || user?.type !== "MASTER") {
        return null;
    }

    return (
        <div className="flex flex-col w-full h-full">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-theme-primary">Dashboard Master</h1>
                <p className="text-lg text-theme-secondary mt-2">Bem-vindo, {user?.name}!</p>
                <p className="text-sm text-theme-tertiary mt-1">Painel de controle administrativo do sistema Lets Go</p>
            </div>
            
            {/* Estatísticas em Tempo Real */}
            <MasterDashboardStats />
            
            {/* Cards de Navegação */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                <div className="bg-theme-secondary p-6 rounded-lg border border-theme-primary shadow-theme-primary hover:shadow-lg transition-all duration-300">
                    <h2 className="text-xl font-semibold mb-4 text-theme-primary">👥 Usuários</h2>
                    <p className="text-theme-secondary mb-4">Gerencie todos os usuários do sistema, visualize perfis e controle acessos</p>
                    <a href="/dashboard/master/usuarios" className="text-[#FF6600] hover:text-[#d45500] font-medium transition-colors flex items-center gap-2">
                        Gerenciar usuários 
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </a>
                </div>
                
                <div className="bg-theme-secondary p-6 rounded-lg border border-theme-primary shadow-theme-primary hover:shadow-lg transition-all duration-300">
                    <h2 className="text-xl font-semibold mb-4 text-theme-primary">🏢 Estabelecimentos</h2>
                    <p className="text-theme-secondary mb-4">Visualize estabelecimentos cadastrados por proprietários e monitore suas atividades</p>
                    <a href="/dashboard/master/estabelecimentos" className="text-[#FF6600] hover:text-[#d45500] font-medium transition-colors flex items-center gap-2">
                        Ver estabelecimentos 
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </a>
                </div>
                
                <div className="bg-theme-secondary p-6 rounded-lg border border-theme-primary shadow-theme-primary hover:shadow-lg transition-all duration-300">
                    <h2 className="text-xl font-semibold mb-4 text-theme-primary">🎭 Promotores</h2>
                    <p className="text-theme-secondary mb-4">Monitore promotores de eventos e suas performances nos relatórios</p>
                    <a href="/dashboard/master/relatorios" className="text-[#FF6600] hover:text-[#d45500] font-medium transition-colors flex items-center gap-2">
                        Ver relatórios 
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </a>
                </div>
                
                <div className="bg-theme-secondary p-6 rounded-lg border border-theme-primary shadow-theme-primary hover:shadow-lg transition-all duration-300">
                    <h2 className="text-xl font-semibold mb-4 text-theme-primary">📊 Relatórios Globais</h2>
                    <p className="text-theme-secondary mb-4">Visualize relatórios detalhados de todo o sistema e métricas de performance</p>
                    <a href="/dashboard/master/relatorios" className="text-[#FF6600] hover:text-[#d45500] font-medium transition-colors flex items-center gap-2">
                        Ver relatórios 
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </a>
                </div>
                
                <div className="bg-theme-secondary p-6 rounded-lg border border-theme-primary shadow-theme-primary hover:shadow-lg transition-all duration-300">
                    <h2 className="text-xl font-semibold mb-4 text-theme-primary">🎪 Eventos</h2>
                    <p className="text-theme-secondary mb-4">Monitore todos os eventos do sistema, vendas e performance dos organizadores</p>
                    <a href="/dashboard/master/eventos" className="text-[#FF6600] hover:text-[#d45500] font-medium transition-colors flex items-center gap-2">
                        Ver eventos 
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </a>
                </div>
                
                <div className="bg-theme-secondary p-6 rounded-lg border border-theme-primary shadow-theme-primary hover:shadow-lg transition-all duration-300">
                    <h2 className="text-xl font-semibold mb-4 text-theme-primary">⚙️ Configurações</h2>
                    <p className="text-theme-secondary mb-4">Configure parâmetros do sistema, integrações e políticas de segurança</p>
                    <a href="/dashboard/master/configuracoes" className="text-[#FF6600] hover:text-[#d45500] font-medium transition-colors flex items-center gap-2">
                        Configurar 
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </a>
                </div>
                
                <div className="bg-theme-secondary p-6 rounded-lg border border-theme-primary shadow-theme-primary hover:shadow-lg transition-all duration-300">
                    <h2 className="text-xl font-semibold mb-4 text-theme-primary">📋 Logs do Sistema</h2>
                    <p className="text-theme-secondary mb-4">Visualize logs de atividades, auditoria e monitoramento de segurança</p>
                    <a href="/dashboard/master/logs" className="text-[#FF6600] hover:text-[#d45500] font-medium transition-colors flex items-center gap-2">
                        Ver logs 
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </a>
                </div>
            </div>
        </div>
    );
}

// TODO: Integrar com contexto de autenticação (useAuth) em Client Component


