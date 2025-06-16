
'use client';

import { Link } from "@nextui-org/react";
import { Tooltip } from "@nextui-org/tooltip";
import { HomeIcon, UsersIcon, CalendarIcon, TicketIcon, SettingsIcon, LayoutDashboardIcon } from "lucide-react";
import { NextAuthProvider as Providers } from "@app/providers";

interface DashboardClientLayoutProps {
    children: React.ReactNode;
    session: any; // TODO: Use a proper session type
}

export default function DashboardClientLayout({ children, session }: DashboardClientLayoutProps) {
    return (
        <Providers>
            <div className="flex h-screen">
                {/* Sidebar */}
                <aside className="w-64 bg-gray-800 text-white flex flex-col">
                    <div className="p-4 text-2xl font-bold border-b border-gray-700">Dashboard</div>
                    <nav className="flex-1 p-4 space-y-2">
                        <Link href="/dashboard" className="flex items-center space-x-2 text-gray-300 hover:text-white hover:bg-gray-700 p-2 rounded">
                            <HomeIcon size={20} />
                            <span>Home</span>
                        </Link>
                        <Link href="/dashboard/eventos" className="flex items-center space-x-2 text-gray-300 hover:text-white hover:bg-gray-700 p-2 rounded">
                            <CalendarIcon size={20} />
                            <span>Eventos</span>
                        </Link>
                        {/* Adicione o link para a Dashboard Master aqui, visível apenas para MASTER */}
                        {session?.user.type === "MASTER" && (
                            <Tooltip placement="right" content="Dashboard Master">
                                <Link href="/dashboard/master" className="flex items-center space-x-2 text-gray-300 hover:text-white hover:bg-gray-700 p-2 rounded">
                                    <LayoutDashboardIcon size={20} />
                                    <span>Master</span>
                                </Link>
                            </Tooltip>
                        )}
                        {/* Outros links de navegação */}
                    </nav>
                    <div className="p-4 border-t border-gray-700">
                        <Link href="/api/auth/signout" className="flex items-center space-x-2 text-gray-300 hover:text-white hover:bg-gray-700 p-2 rounded">
                            <SettingsIcon size={20} />
                            <span>Sair</span>
                        </Link>
                    </div>
                </aside>

                {/* Main content */}
                <main className="flex-1 p-6 overflow-y-auto bg-gray-100">
                    {children}
                </main>
            </div>
        </Providers>
    );
}


