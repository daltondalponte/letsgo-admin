import Link from "next/link";

export default function SignOut() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-theme-primary">
      <div className="rounded-3xl bg-theme-secondary shadow-theme-primary px-12 py-10 flex flex-col items-center max-w-md w-full">
        <h1 className="text-3xl font-bold text-theme-primary mb-4 text-center">Sair da conta</h1>
        <p className="text-lg text-theme-secondary mb-8 text-center">Tem certeza que deseja sair?</p>
        <Link href="/auth/signin">
          <button className="w-full rounded-md bg-accent-primary px-6 py-3 text-lg font-semibold text-white shadow-theme-primary hover:bg-accent-secondary transition-all">Voltar para o login</button>
        </Link>
      </div>
    </main>
  );
} 