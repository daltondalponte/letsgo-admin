"use client";
import { useAuth } from "@/context/authContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardBody, CardHeader, Button, Spinner } from "@nextui-org/react";
import { BuildingIcon, MapPinIcon, PhoneIcon, GlobeIcon, EditIcon, PlusIcon } from "lucide-react";
import axios from "axios";

interface Establishment {
  id: string;
  name: string;
  address: string;
  description: string;
  contactPhone: string;
  website: string;
  socialMedia: any;
  photos: string[];
  coordinates: number[];
  createdAt: string;
  updatedAt: string;
}

export default function EstabelecimentosPage() {
  const { user, isAuthenticated, loading, token } = useAuth();
  const router = useRouter();
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [loadingEstablishments, setLoadingEstablishments] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      router.push("/auth/signin");
    } else if (user?.type !== "PROFESSIONAL_OWNER") {
      router.push("/dashboard");
    } else {
      fetchEstablishments();
    }
  }, [isAuthenticated, user, router, loading]);

  const fetchEstablishments = async () => {
    if (!token) return;

    try {
      setLoadingEstablishments(true);
      const response = await axios.get('/api/establishment', {
        headers: {
          'authorization': `Bearer ${token}`
        }
      });
      
      setEstablishments(response.data.establishments || []);
      setError(null);
    } catch (error) {
      setError('Erro ao carregar estabelecimentos');
      console.error('Erro:', error);
    } finally {
      setLoadingEstablishments(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen text-lg">Carregando...</div>;
  }

  if (!isAuthenticated || user?.type !== "PROFESSIONAL_OWNER") {
    return null;
  }

  return (
    <div className="flex flex-col w-full h-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-theme-primary">Meus Estabelecimentos</h1>
        <p className="text-lg text-theme-secondary mt-2">Gerencie seus estabelecimentos</p>
        <p className="text-sm text-theme-tertiary mt-1">Visualize e edite informações dos seus estabelecimentos</p>
      </div>

      {error && (
        <Card className="bg-red-50 border border-red-200 mb-6">
          <CardBody className="text-red-600">
            {error}
          </CardBody>
        </Card>
      )}

      {loadingEstablishments ? (
        <div className="flex items-center justify-center h-64">
          <Spinner size="lg" color="primary" />
        </div>
      ) : establishments.length === 0 ? (
        <Card className="bg-theme-secondary border border-theme-primary">
          <CardBody className="text-center py-12">
            <BuildingIcon size={48} className="mx-auto mb-4 text-theme-tertiary" />
            <h3 className="text-xl font-semibold text-theme-primary mb-2">Nenhum estabelecimento encontrado</h3>
            <p className="text-theme-secondary mb-6">Você ainda não cadastrou nenhum estabelecimento.</p>
            <Button 
              color="primary" 
              className="bg-[#FF6600] hover:bg-[#d45500]"
              startContent={<PlusIcon size={20} />}
            >
              Cadastrar Estabelecimento
            </Button>
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {establishments.map((establishment) => (
            <Card key={establishment.id} className="bg-theme-secondary border border-theme-primary hover:shadow-lg transition-all duration-300">
              <CardHeader className="pb-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <BuildingIcon size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-theme-primary">{establishment.name}</h3>
                    <p className="text-sm text-theme-tertiary">
                      Criado em {new Date(establishment.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardBody>
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <MapPinIcon size={16} className="text-theme-tertiary mt-0.5" />
                    <p className="text-sm text-theme-secondary">{establishment.address}</p>
                  </div>
                  
                  {establishment.contactPhone && (
                    <div className="flex items-center gap-2">
                      <PhoneIcon size={16} className="text-theme-tertiary" />
                      <p className="text-sm text-theme-secondary">{establishment.contactPhone}</p>
                    </div>
                  )}
                  
                  {establishment.website && (
                    <div className="flex items-center gap-2">
                      <GlobeIcon size={16} className="text-theme-tertiary" />
                      <a 
                        href={establishment.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-[#FF6600] hover:text-[#d45500]"
                      >
                        {establishment.website}
                      </a>
                    </div>
                  )}
                  
                  {establishment.description && (
                    <p className="text-sm text-theme-secondary mt-3">
                      {establishment.description}
                    </p>
                  )}
                </div>
                
                <div className="flex gap-2 mt-4">
                  <Button 
                    size="sm" 
                    variant="bordered" 
                    color="primary"
                    startContent={<EditIcon size={16} />}
                    className="flex-1"
                  >
                    Editar
                  </Button>
                  <Button 
                    size="sm" 
                    color="primary"
                    className="bg-[#FF6600] hover:bg-[#d45500] flex-1"
                  >
                    Ver Eventos
                  </Button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 