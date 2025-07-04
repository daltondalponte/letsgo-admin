"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next-nprogress-bar";
import GoogleAutocomplete from "@/components/GoogleAutocomplete";
import GoogleMapsScriptLoader from "@/components/GoogleMapsScriptLoader";

export default function SignupPage() {
  const router = useRouter();
  const [type, setType] = useState<"OWNER" | "PROMOTER" | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    establishmentName: "",
    cnpj: "",
    document: "",
  });
  const [address, setAddress] = useState("");
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | undefined>(undefined);
  const [autocompleteActive, setAutocompleteActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Forçar tema escuro ao entrar na página
    document.documentElement.setAttribute('data-theme', 'dark');
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  }, []);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        router.push('/auth/signin');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleTypeSelect = (t: "OWNER" | "PROMOTER") => {
    setType(t);
    setError(null);
    setSuccess(null);
  };

  const handleAddressChange = (address: string, coordinates?: { lat: number; lng: number }) => {
    setAddress(address);
    setCoordinates(coordinates);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      let payload: any = {
        name: form.name,
        email: form.email,
        password: form.password,
        type: type === "OWNER" ? "PROFESSIONAL_OWNER" : "PROFESSIONAL_PROMOTER",
        isOwnerOfEstablishment: type === "OWNER",
      };
      if (type === "OWNER") {
        if (!form.establishmentName || !form.cnpj || !address) {
          setError("Todos os campos são obrigatórios para dono de estabelecimento.");
          setLoading(false);
          return;
        }
        payload = {
          ...payload,
          establishment: {
            name: form.establishmentName,
            cnpj: form.cnpj,
            address: address,
            coordinates: coordinates,
            description: "",
            contactPhone: "",
            website: "",
            socialMedia: {},
          },
          document: form.cnpj,
        };
      } else if (type === "PROMOTER") {
        if (!form.document || !address) {
          setError("Todos os campos são obrigatórios para promoter.");
          setLoading(false);
          return;
        }
        payload = {
          ...payload,
          document: form.document,
          address: address,
          coordinates: coordinates,
        };
      }
      const res = await fetch("/api/professional-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Erro ao cadastrar. Tente novamente.");
      }
      setSuccess("Cadastro realizado com sucesso! Aguarde a ativação pelo administrador.");
      setForm({ name: "", email: "", password: "", establishmentName: "", cnpj: "", document: "" });
      setAddress("");
      setCoordinates(undefined);
      setType(null);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || "Erro ao cadastrar. Tente novamente.");
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-theme-primary">
      <GoogleMapsScriptLoader />
      <div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8 w-full max-w-md">
        <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
          <img src="/img/logo.png" alt="Lets Go Admin" className="w-24 h-24 mb-4 mx-auto" />
          <h1 className="text-2xl font-bold text-center mb-2 text-theme-primary">Cadastro Profissional</h1>
          {success && (
            <div className="w-full mb-4 p-3 rounded bg-green-100 text-green-800 text-center border border-green-300">
              {success} Redirecionando para login...
            </div>
          )}
          {error && (
            <div className="w-full mb-4 p-3 rounded bg-red-100 text-red-800 text-center border border-red-300">
              {error}
            </div>
          )}
          <p className="text-xs text-theme-secondary mb-6 text-center">
            Cadastre-se como <b>Dono de Estabelecimento</b> ou <b>Promoter/Criador de Eventos</b>.<br/>
            <span className="text-accent-primary">Cadastros de usuários comuns devem ser feitos diretamente pelo app mobile Lets Go.</span>
          </p>
          {!type && (
            <div className="w-full flex flex-col gap-4 mb-6">
              <button
                className="w-full rounded-md border border-accent-primary px-3 py-2 text-sm font-semibold bg-white hover:bg-accent-primary hover:text-white transition-colors"
                onClick={() => handleTypeSelect("OWNER")}
                style={{ color: 'var(--accent-primary)' }}
              >
                Sou Dono de Estabelecimento
              </button>
              <div className="text-xs text-theme-secondary text-left mb-2">
                <b>Donos de Estabelecimento</b> devem informar o endereço do local, que será convertido em um pin no mapa do app mobile. Após aprovação, poderão cadastrar eventos no seu local.
              </div>
              <button
                className="w-full rounded-md border border-accent-primary px-3 py-2 text-sm font-semibold bg-white hover:bg-accent-primary hover:text-white transition-colors"
                onClick={() => handleTypeSelect("PROMOTER")}
                style={{ color: 'var(--accent-primary)' }}
              >
                Sou Promoter / Criador de Eventos
              </button>
              <div className="text-xs text-theme-secondary text-left">
                <b>Promoters/Criadores de Eventos</b> não precisam de endereço próprio. Poderão criar eventos em estabelecimentos já cadastrados, após aprovação do dono do local.
              </div>
            </div>
          )}
          {type && (
            <form onSubmit={handleSubmit} className="space-y-4 w-full mt-2">
              <div className="flex gap-2 mb-2">
                <button
                  type="button"
                  className={`flex-1 rounded-md px-2 py-1.5 text-sm font-semibold border ${type === "OWNER" ? "bg-accent-primary text-white border-accent-primary" : "bg-white border-accent-primary"}`}
                  onClick={() => handleTypeSelect("OWNER")}
                  style={type === "OWNER" ? { color: '#fff' } : { color: 'var(--accent-primary)' }}
                >
                  Dono de Estabelecimento
                </button>
                <button
                  type="button"
                  className={`flex-1 rounded-md px-2 py-1.5 text-sm font-semibold border ${type === "PROMOTER" ? "bg-accent-primary text-white border-accent-primary" : "bg-white border-accent-primary"}`}
                  onClick={() => handleTypeSelect("PROMOTER")}
                  style={type === "PROMOTER" ? { color: '#fff' } : { color: 'var(--accent-primary)' }}
                >
                  Promoter
                </button>
              </div>
              <input
                type="text"
                name="name"
                placeholder="Seu nome completo"
                value={form.name}
                onChange={handleChange}
                required
                className="block w-full rounded-md border-0 px-2 py-1.5 text-theme-primary bg-white shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-accent-primary sm:text-sm sm:leading-6"
              />
              <input
                type="email"
                name="email"
                placeholder="E-mail profissional"
                value={form.email}
                onChange={handleChange}
                required
                className="block w-full rounded-md border-0 px-2 py-1.5 text-theme-primary bg-white shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-accent-primary sm:text-sm sm:leading-6"
              />
              <input
                type="password"
                name="password"
                placeholder="Senha"
                value={form.password}
                onChange={handleChange}
                required
                minLength={8}
                className="block w-full rounded-md border-0 px-2 py-1.5 text-theme-primary bg-white shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-accent-primary sm:text-sm sm:leading-6"
              />
              {type === "OWNER" && (
                <>
                  <input
                    type="text"
                    name="establishmentName"
                    placeholder="Nome do Estabelecimento"
                    value={form.establishmentName}
                    onChange={handleChange}
                    required
                    className="block w-full rounded-md border-0 px-2 py-1.5 text-theme-primary bg-white shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-accent-primary sm:text-sm sm:leading-6"
                  />
                  <input
                    type="text"
                    name="cnpj"
                    placeholder="CNPJ do Estabelecimento"
                    value={form.cnpj}
                    onChange={handleChange}
                    required
                    className="block w-full rounded-md border-0 px-2 py-1.5 text-theme-primary bg-white shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-accent-primary sm:text-sm sm:leading-6"
                  />
                  <GoogleAutocomplete
                    label="Endereço"
                    value={address}
                    onChange={handleAddressChange}
                    placeholder="Endereço completo do Estabelecimento"
                    className="mb-2"
                    onAutocompleteActive={setAutocompleteActive}
                  />
                  {coordinates && (
                    <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                      <strong>Coordenadas detectadas:</strong><br />
                      Latitude: {typeof coordinates.lat === 'number' ? coordinates.lat.toFixed(6) : 'N/A'}<br />
                      Longitude: {typeof coordinates.lng === 'number' ? coordinates.lng.toFixed(6) : 'N/A'}
                    </div>
                  )}
                </>
              )}
              {type === "PROMOTER" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-theme-primary mb-2">
                      CPF ou CNPJ *
                    </label>
                    <input
                      type="text"
                      value={form.document}
                      onChange={(e) => setForm({ ...form, document: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-primary"
                      placeholder="Digite seu CPF ou CNPJ"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-theme-primary mb-2">
                      Endereço (para fins de segurança) *
                    </label>
                    <GoogleAutocomplete
                      value={address}
                      onChange={(address, coords) => {
                        setAddress(address);
                        setCoordinates(coords);
                      }}
                      placeholder="Digite seu endereço completo"
                      onAutocompleteActive={setAutocompleteActive}
                    />
                    {coordinates && (
                      <p className="text-xs text-gray-500 mt-1">
                        Coordenadas: {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
                      </p>
                    )}
                  </div>
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full justify-center rounded-md bg-accent-primary px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-theme-primary hover:bg-accent-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary disabled:opacity-60"
                style={{ color: '#fff' }}
              >
                {loading ? "Cadastrando..." : "Cadastrar"}
              </button>
              <div className="mt-4 text-center">
                <button type="button" className="text-xs text-theme-secondary underline" onClick={() => setType(null)}>
                  Voltar para seleção de tipo
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </main>
  );
} 