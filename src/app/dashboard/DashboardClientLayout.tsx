'use client';

import { Link, Button } from "@nextui-org/react";
import { HomeIcon, UsersIcon, CalendarIcon, TicketIcon, LayoutDashboardIcon, BuildingIcon, BarChartIcon, CogIcon, FileTextIcon, LogOutIcon, SunIcon, MoonIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import { useTheme } from "../../hooks/useTheme";
import { useAuth } from "@/context/authContext";

interface DashboardClientLayoutProps {
    children: React.ReactNode;
}

export default function DashboardClientLayout({ children }: DashboardClientLayoutProps) {
    const { user } = useAuth();
    const isMaster = user?.type === "MASTER";
    const isProfessionalOwner = user?.type === "PROFESSIONAL_OWNER";
    const isProfessionalPromoter = user?.type === "PROFESSIONAL_PROMOTER";
    const isProfessional = isProfessionalOwner || isProfessionalPromoter;
    const pathname = usePathname();
    const { theme, toggleTheme, mounted } = useTheme();

    const isActiveLink = (href: string) => {
        if (href === "/dashboard/master" && pathname === "/dashboard/master") return true;
        if (href === "/dashboard" && pathname === "/dashboard") return true;
        return pathname.startsWith(href) && href !== "/dashboard/master" && href !== "/dashboard";
    };

    const getLinkClasses = (href: string) => {
        const isActive = isActiveLink(href);
        return `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
            isActive 
                ? 'text-[#FF6600] bg-orange-50 border-r-2 border-[#FF6600]' 
                : 'text-theme-secondary hover:text-[#FF6600] hover:bg-orange-50'
        }`;
    };

    const getIconClasses = (href: string) => {
        const isActive = isActiveLink(href);
        return `group-hover:text-[#FF6600] ${isActive ? 'text-[#FF6600]' : ''}`;
    };

    // Evitar renderização até que o tema esteja carregado
    if (!mounted) {
        return <div style={{ visibility: 'hidden' }}>{children}</div>;
    }

    return (
        <div className="flex h-screen bg-theme-primary">
            <aside className="w-64 bg-theme-secondary border-r border-theme-primary flex flex-col shadow-theme-primary">
                <div className="p-6 border-b border-theme-primary">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#FF6600] rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-sm">LG</span>
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-theme-primary">
                                {isMaster ? "Master" : "Dashboard"}
                            </h1>
                            <p className="text-xs text-theme-tertiary">Lets Go Admin</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {isMaster && (
                        <>
                            <Link href="/dashboard/master" className={getLinkClasses("/dashboard/master")}>
                                <LayoutDashboardIcon size={20} className={getIconClasses("/dashboard/master")} />
                                <span className="font-medium">Home Master</span>
                            </Link>
                            <Link href="/dashboard/master/usuarios" className={getLinkClasses("/dashboard/master/usuarios")}>
                                <UsersIcon size={20} className={getIconClasses("/dashboard/master/usuarios")} />
                                <span className="font-medium">Usuários</span>
                            </Link>
                            <Link href="/dashboard/master/estabelecimentos" className={getLinkClasses("/dashboard/master/estabelecimentos")}>
                                <BuildingIcon size={20} className={getIconClasses("/dashboard/master/estabelecimentos")} />
                                <span className="font-medium">Estabelecimentos</span>
                            </Link>
                            <Link href="/dashboard/master/eventos" className={getLinkClasses("/dashboard/master/eventos")}>
                                <CalendarIcon size={20} className={getIconClasses("/dashboard/master/eventos")} />
                                <span className="font-medium">Eventos</span>
                            </Link>
                            <Link href="/dashboard/master/relatorios" className={getLinkClasses("/dashboard/master/relatorios")}>
                                <BarChartIcon size={20} className={getIconClasses("/dashboard/master/relatorios")} />
                                <span className="font-medium">Relatórios</span>
                            </Link>
                            <Link href="/dashboard/master/configuracoes" className={getLinkClasses("/dashboard/master/configuracoes")}>
                                <CogIcon size={20} className={getIconClasses("/dashboard/master/configuracoes")} />
                                <span className="font-medium">Configurações</span>
                            </Link>
                        </>
                    )}

                    {isProfessional && (
                        <>
                            <Link href="/dashboard" className={getLinkClasses("/dashboard")}>
                                <HomeIcon size={20} className={getIconClasses("/dashboard")} />
                                <span className="font-medium">Home</span>
                            </Link>
                            <Link href="/dashboard/eventos" className={getLinkClasses("/dashboard/eventos")}>
                                <CalendarIcon size={20} className={getIconClasses("/dashboard/eventos")} />
                                <span className="font-medium">Meus Eventos</span>
                            </Link>
                            {isProfessionalOwner && (
                                <Link href="/dashboard/aprovacoes" className={getLinkClasses("/dashboard/aprovacoes")}>
                                    <FileTextIcon size={20} className={getIconClasses("/dashboard/aprovacoes")} />
                                    <span className="font-medium">Aprovações</span>
                                </Link>
                            )}
                            <Link href="/dashboard/cupons" className={getLinkClasses("/dashboard/cupons")}>
                                <TicketIcon size={20} className={getIconClasses("/dashboard/cupons")} />
                                <span className="font-medium">Cupons</span>
                            </Link>
                            <Link href="/dashboard/relatorios" className={getLinkClasses("/dashboard/relatorios")}>
                                <BarChartIcon size={20} className={getIconClasses("/dashboard/relatorios")} />
                                <span className="font-medium">Relatórios</span>
                            </Link>
                            <Link href="/dashboard/administradores" className={getLinkClasses("/dashboard/administradores")}>
                                <UsersIcon size={20} className={getIconClasses("/dashboard/administradores")} />
                                <span className="font-medium">Administradores</span>
                            </Link>
                        </>
                    )}
                </nav>

                <div className="p-4 border-t border-theme-primary">
                    <div className="mb-3">
                        <Button
                            size="sm"
                            variant="light"
                            onPress={toggleTheme}
                            className="text-theme-secondary hover:text-[#FF6600] hover:bg-orange-50"
                            title={theme === 'light' ? 'Mudar para tema escuro' : 'Mudar para tema claro'}
                            startContent={theme === 'light' ? <MoonIcon size={16} /> : <SunIcon size={16} />}
                        >
                            {theme === 'light' ? 'Tema Escuro' : 'Tema Claro'}
                        </Button>
                    </div>
                    
                    <div className="mb-3">
                        <div className="text-sm font-medium text-theme-primary">
                            {user?.name}
                        </div>
                        <div className="text-xs text-theme-tertiary">
                            {user?.email}
                        </div>
                    </div>
                    <Link 
                        href="/auth/signout" 
                        className="flex items-center gap-3 px-3 py-2.5 text-theme-secondary hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 group"
                    >
                        <LogOutIcon size={20} className="group-hover:text-red-600" />
                        <span className="font-medium">Sair</span>
                    </Link>
                </div>
            </aside>

            <main className="flex-1 overflow-y-auto bg-theme-primary">
                <div className="p-6">
                    {children}
                </div>
            </main>
        </div>
    );
}
