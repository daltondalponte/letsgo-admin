"use client"
import { useState, useEffect, useRef } from "react";
import { Input, Button, Card, CardBody, Spinner, useDisclosure, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@nextui-org/react";
import { SearchIcon, MapPinIcon, BuildingIcon } from "lucide-react";
import { useAuth } from "@/context/authContext";
import axios from "axios";

interface Establishment {
  id: string;
  name: string;
  address: string;
  description?: string;
}

interface EstablishmentSearchProps {
  onEstablishmentSelect: (establishment: Establishment) => void;
  selectedEstablishment?: Establishment | null;
  placeholder?: string;
}

export default function EstablishmentSearch({ 
  onEstablishmentSelect, 
  selectedEstablishment, 
  placeholder = "Buscar estabelecimento..." 
}: EstablishmentSearchProps) {
  const { token } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (searchTerm.trim().length >= 2) {
      // Debounce da busca
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      searchTimeoutRef.current = setTimeout(() => {
        searchEstablishments();
      }, 300);
    } else {
      setEstablishments([]);
      setShowResults(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm]);

  const searchEstablishments = async () => {
    if (!token) return;

    setLoading(true);
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/establishment/search-for-promoters?query=${encodeURIComponent(searchTerm)}`,
        {
          headers: {
            'authorization': `Bearer ${token}`
          }
        }
      );

      setEstablishments(response.data.establishments || []);
      setShowResults(true);
    } catch (error) {
      console.error('Erro ao buscar estabelecimentos:', error);
      setEstablishments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEstablishmentSelect = (establishment: Establishment) => {
    onEstablishmentSelect(establishment);
    setSearchTerm(establishment.name);
    setShowResults(false);
    setEstablishments([]);
  };

  const handleViewEstablishment = (establishment: Establishment) => {
    // Aqui você pode implementar a visualização detalhada do estabelecimento
    console.log('Visualizar estabelecimento:', establishment);
  };

  const clearSelection = () => {
    onEstablishmentSelect(null as any);
    setSearchTerm("");
    setShowResults(false);
    setEstablishments([]);
  };

  return (
    <div className="relative w-full">
      <div className="flex gap-2">
        <Input
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
          startContent={<SearchIcon className="w-4 h-4 text-gray-400" />}
          endContent={
            loading ? (
              <Spinner size="sm" />
            ) : (
              <SearchIcon className="w-4 h-4 text-gray-400" />
            )
          }
          onFocus={() => {
            if (establishments.length > 0) {
              setShowResults(true);
            }
          }}
        />
        {selectedEstablishment && (
          <Button
            size="sm"
            color="danger"
            variant="flat"
            onPress={clearSelection}
          >
            Limpar
          </Button>
        )}
      </div>

      {/* Resultados da busca */}
      {showResults && establishments.length > 0 && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto">
          <CardBody className="p-0">
            {establishments.map((establishment) => (
              <div
                key={establishment.id}
                className="p-3 hover:bg-orange-50 hover:text-orange-700 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors duration-200 group"
                onClick={() => handleEstablishmentSelect(establishment)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <BuildingIcon className="w-4 h-4 text-blue-500 group-hover:text-orange-500" />
                      <h4 className="font-medium text-sm">{establishment.name}</h4>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600 group-hover:text-orange-600">
                      <MapPinIcon className="w-3 h-3" />
                      <span>{establishment.address}</span>
                    </div>
                    {establishment.description && (
                      <p className="text-xs text-gray-500 group-hover:text-orange-500 mt-1 line-clamp-2">
                        {establishment.description}
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="flat"
                    onPress={() => handleEstablishmentSelect(establishment)}
                  >
                    Selecionar
                  </Button>
                </div>
              </div>
            ))}
          </CardBody>
        </Card>
      )}

      {/* Estabelecimento selecionado */}
      {selectedEstablishment && (
        <Card className="mt-2 bg-blue-50 border-blue-200">
          <CardBody className="p-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <BuildingIcon className="w-4 h-4 text-blue-600" />
                  <h4 className="font-medium text-sm text-blue-800">
                    {selectedEstablishment.name}
                  </h4>
                </div>
                <div className="flex items-center gap-2 text-xs text-blue-600">
                  <MapPinIcon className="w-3 h-3" />
                  <span>{selectedEstablishment.address}</span>
                </div>
                {selectedEstablishment.description && (
                  <p className="text-xs text-blue-600 mt-1">
                    {selectedEstablishment.description}
                  </p>
                )}
              </div>
              <Button
                size="sm"
                color="danger"
                variant="flat"
                onPress={clearSelection}
              >
                Remover
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Modal de detalhes do estabelecimento */}
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="md">
        <ModalContent>
          <ModalHeader>Detalhes do Estabelecimento</ModalHeader>
          <ModalBody>
            {/* Conteúdo do modal pode ser implementado aqui */}
            <p>Detalhes do estabelecimento selecionado...</p>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="flat" onPress={onOpenChange}>
              Fechar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Overlay para fechar resultados ao clicar fora */}
      {showResults && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowResults(false)}
        />
      )}
    </div>
  );
} 