// src/app/auth/signin/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next-nprogress-bar";
import { Input, Button, Card, CardBody } from "@nextui-org/react";
import { useAuth } from "@/context/authContext";

export default function SignInPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  }, []);

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(form.email, form.password);
      // Se login for bem-sucedido, será redirecionado pelo contexto
    } catch (err: any) {
      setError(err.message || "E-mail ou senha inválidos.");
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-content1">
      <Card className="w-full max-w-md shadow-lg">
        <CardBody>
          <div className="flex flex-col items-center mb-4">
            <img src="/img/logo.png" alt="Lets Go Admin" className="w-40 h-40 mb-2" />
          </div>
          <h1 className="text-2xl font-bold mb-6 text-center">Entrar</h1>
          {error && <div className="mb-4 text-red-500 font-medium bg-red-50 border border-red-200 rounded p-2">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="E-mail"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              isRequired
            />
            <Input
              label="Senha"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              isRequired
            />
            <div className="flex gap-2">
              <Button type="submit" className="bg-[#FF6600] text-white font-bold w-full" isLoading={loading}>
                Entrar
              </Button>
              <Button type="button" className="bg-white border border-[#FF6600] text-[#FF6600] font-bold w-full" onPress={() => router.push("/")}> 
                Voltar
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}


