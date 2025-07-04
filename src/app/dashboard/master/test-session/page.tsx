"use client";
import { useAuth } from "@/context/authContext";

export default function TestSessionPage() {
  const { user, token } = useAuth();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Teste da Sessão</h1>
      <div className="space-y-4">
        <div>
          <strong>Status:</strong> {user ? 'Autenticado' : 'Não autenticado'}
        </div>
        <div>
          <strong>Sessão Completa:</strong> 
          <pre className="bg-gray-100 p-2 rounded mt-2 text-xs overflow-auto">
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>
        <div>
          <strong>Access Token:</strong> 
          <div className="bg-gray-100 p-2 rounded mt-2 text-xs break-all">
            {token || 'Não encontrado'}
          </div>
        </div>
        <div>
          <strong>User:</strong> 
          <pre className="bg-gray-100 p-2 rounded mt-2 text-xs overflow-auto">
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
} 