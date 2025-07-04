"use client"
import Image from "next/image"
import { useRouter } from "next-nprogress-bar"
import { useEffect } from "react"

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // Forçar tema escuro ao entrar na página
    document.documentElement.setAttribute('data-theme', 'dark');
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-theme-primary font-sans">
      {/* Header */}
      <header className="w-full flex justify-between items-center px-8 py-6 bg-theme-secondary shadow-theme-primary">
        <div className="flex items-center gap-3">
          <img src="/img/logo.png" alt="Let's Go Logo" className="w-12 h-12" />
          <span className="text-2xl font-bold text-theme-primary">Let's Go</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => router.push("/auth/signin")}
            className="px-6 py-2 rounded-md bg-accent-primary text-white font-semibold shadow-theme-primary hover:bg-accent-secondary transition-all"
          >
            Login
          </button>
          <button
            onClick={() => router.push("/auth/signup")}
            className="px-6 py-2 rounded-md border-2 border-accent-primary font-semibold bg-white hover:bg-white hover:border-4 transition-all"
            style={{ color: 'var(--accent-primary)' }}
          >
            Cadastrar
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex flex-col md:flex-row items-center justify-between px-8 py-16 gap-12 bg-theme-primary flex-1">
        <div className="flex-1 max-w-xl">
          <h1 className="text-4xl md:text-5xl font-extrabold text-theme-primary mb-6">Vai pra festa? <span className="text-accent-primary">Let's Go!</span></h1>
          <p className="text-lg text-theme-secondary mb-8">O app que conecta você aos melhores eventos e experiências noturnas da sua cidade.</p>
        </div>
        <div className="flex-1 flex justify-center">
          {/* Imagem ilustrativa */}
          <img
            src="/img/foto-festa01.jpg"
            alt="Pessoas felizes em ambiente noturno conversando sorrindo com celular na mão"
            width={400}
            height={400}
            className="rounded-2xl shadow-lg object-cover"
            style={{ maxWidth: '100%', height: 'auto' }}
          />
        </div>
      </section>

      {/* Sessão Usuário Comum com parallax */}
      <section
        className="w-full py-16 px-8 flex flex-col md:flex-row items-center gap-12 relative overflow-hidden"
        style={{
          backgroundImage: "url('/img/foto-festa01.jpg')",
          backgroundAttachment: "fixed",
          backgroundPosition: "center",
          backgroundSize: "cover",
        }}
      >
        {/* Overlay para opacidade */}
        <div className="absolute inset-0 bg-black opacity-40 z-0" />
        <div className="flex-1 relative z-10">
          <h2 className="text-2xl font-bold text-accent-primary mb-4">Para quem curte sair!</h2>
          <ul className="text-lg text-white space-y-4 list-disc list-inside">
            <li>Um novo jeito de encontrar os seus eventos preferidos, e descobrir novos lugares.</li>
            <li>Compre ingressos de forma segura e rápida, diretamente no app.</li>
            <li>Com o ingresso comprado, é só acessar QR CODE e chegar no local e entrar sem dor de cabeça.</li>
          </ul>
        </div>
        <div className="flex-1 relative z-10"></div>
      </section>

      {/* Sessão Profissional */}
      <section className="w-full bg-theme-secondary py-16 px-8 flex flex-col md:flex-row items-center gap-12">
        <div className="flex-1 flex justify-center order-2 md:order-1">
          {/* Imagem ilustrativa para profissional */}
          <img
            src="/img/foto-festa01.jpg"
            alt="Profissionais felizes usando o sistema Let's Go"
            width={350}
            height={350}
            className="rounded-xl shadow-md object-cover"
            style={{ maxWidth: '100%', height: 'auto' }}
          />
        </div>
        <div className="flex-1 order-1 md:order-2">
          <h2 className="text-2xl font-bold text-accent-primary mb-4">Para profissionais do entretenimento</h2>
          <ul className="text-lg text-theme-primary space-y-4 list-disc list-inside">
            <li>Perfeito para donos de casas de show, e bares com shows e cobrança de entrada.</li>
            <li>Perfeito também para produtores de evento que produzem eventos em locais de terceiros.</li>
            <li>Crie e personalize seus eventos de forma rápida e prática.</li>
            <li>Venda ingressos e acompanhe suas vendas em tempo real.</li>
            <li>Área de administração Web com suporte e relatórios em tempo real.</li>
          </ul>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full bg-theme-primary py-8 flex flex-col items-center gap-2 border-t border-theme-secondary mt-auto">
        <span className="text-theme-secondary text-lg">Siga a gente no Instagram:</span>
        <a href="https://instagram.com/letsgoapp" target="_blank" rel="noopener noreferrer" className="text-accent-primary font-bold text-lg hover:underline">@letsgoapp</a>
      </footer>
    </div>
  )
}
