"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function BlockedPage() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    // Buscar usuário do localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      router.replace("/auth/signin");
    }
  }, [router]);

  if (!user) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-theme-primary">
        <div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8 w-full max-w-md">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-primary mx-auto"></div>
            <p className="mt-4 text-theme-secondary">Carregando...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-theme-primary">
      <div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8 w-full max-w-md">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm flex flex-col items-center">
          {/* Logo */}
          <img src="/img/logo.png" alt="Lets Go Admin" className="w-32 h-32 mb-6 mx-auto" />
          <h1 className="text-2xl font-bold text-center mb-8 text-theme-primary">Lets Go Admin</h1>
          {/* Card de Aviso */}
          <div className="w-full bg-white rounded-lg shadow-lg p-8 border border-gray-200">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-4">
                <svg className="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Acesso Temporariamente Bloqueado
              </h2>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Seu cadastro foi realizado com sucesso, mas seu acesso ainda não foi liberado pelo administrador do sistema.
                <br /><br />
                Você receberá uma notificação por e-mail assim que seu acesso for ativado.
              </p>
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-500 mb-2">Informações do Cadastro:</p>
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-sm text-gray-600">{user.email}</p>
                <p className="text-sm text-gray-600 capitalize">
                  {user.type?.replace('_', ' ').toLowerCase()}
                </p>
              </div>
              <div className="space-y-3">
                <button
                  onClick={() => router.push("/auth/signin")}
                  className="w-full bg-accent-primary text-white py-2 px-4 rounded-md hover:bg-accent-secondary transition-colors duration-200 font-medium"
                >
                  Voltar para Login
                </button>
              </div>
            </div>
          </div>
          <div className="mt-8 text-center">
            <p className="text-sm text-theme-tertiary">
              Em caso de dúvidas, entre em contato com o suporte.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
} 