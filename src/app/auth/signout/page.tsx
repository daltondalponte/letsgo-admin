"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/authContext";

export default function SignOutPage() {
  const router = useRouter();
  const { logout } = useAuth();

  useEffect(() => {
    logout();
    // O método logout já faz o push para /auth/signin
  }, [logout]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-theme-primary">
      <div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8 w-full max-w-md">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-primary mx-auto"></div>
          <p className="mt-4 text-theme-secondary">Saindo...</p>
        </div>
      </div>
    </main>
  );
} 