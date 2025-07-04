"use client"
import { useState, useEffect } from "react";
import { Card, CardBody, CardHeader, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Button, Input, Chip, Pagination, useDisclosure, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Image } from "@nextui-org/react";
import { SearchIcon, EyeIcon, MapPinIcon } from "lucide-react";
import { useAuth } from "@/context/authContext";
import axios from "axios";

interface Establishment {
  id: string;
  name: string;
  address: string;
  photos: string[];
  coordinates: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  owner?: {
    id: string;
    name: string;
    email: string;
    isActive: boolean;
  };
}

export default function EstabelecimentosPage() {
  const { user, token } = useAuth();
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [selectedEstablishment, setSelectedEstablishment] = useState<Establishment | null>(null);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  const rowsPerPage = 10;

  useEffect(() => {
    if (!token) return;
    fetchEstablishments();
  }, [token]);

  const fetchEstablishments = async () => {
    try {
      setLoading(true);
      // Buscar da API real
      
      // Buscar estabelecimentos
      const establishmentsResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/establishment/`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Buscar todos os usuários para mapear os proprietários
      const usersResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/all`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Criar mapa de usuários por UID
      const usersMap = new Map();
      usersResponse.data.users.forEach((user: any) => {
        usersMap.set(user.uid, user);
      });
      
      // Mapear estabelecimentos com dados completos do proprietário
      const establishmentsWithOwner = establishmentsResponse.data.establishments.map((establishment: any) => {
        const owner = usersMap.get(establishment.userOwnerUid);
        return {
          ...establishment,
          owner: owner ? {
            id: owner.uid,
            name: owner.name,
            email: owner.email,
            isActive: owner.isActive
          } : null
        };
      });
      
      setEstablishments(establishmentsWithOwner);
    } catch (error) {
      setEstablishments([]);
      // Exibir mensagem de erro se necessário
    } finally {
      setLoading(false);
    }
  };

  const filteredEstablishments = establishments.filter(establishment =>
    establishment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    establishment.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pages = Math.ceil(filteredEstablishments.length / rowsPerPage);
  const items = filteredEstablishments.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const handleViewEstablishment = (establishment: Establishment) => {
    setSelectedEstablishment(establishment);
    onOpen();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Gestão de Estabelecimentos</h1>
      </div>

      <Card className="card-theme">
        <CardHeader>
          <Input
            placeholder="Buscar estabelecimentos..."
            startContent={<SearchIcon size={20} />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm input-theme"
          />
        </CardHeader>
        <CardBody className="table-container">
          <Table aria-label="Tabela de estabelecimentos" className="table-theme">
            <TableHeader>
              <TableColumn>NOME</TableColumn>
              <TableColumn>ENDEREÇO</TableColumn>
              <TableColumn>FOTOS</TableColumn>
              <TableColumn>PROPRIETÁRIO</TableColumn>
              <TableColumn>STATUS</TableColumn>
              <TableColumn>CRIADO EM</TableColumn>
              <TableColumn>AÇÕES</TableColumn>
            </TableHeader>
            <TableBody
              emptyContent={loading ? "Carregando..." : "Nenhum estabelecimento encontrado"}
              items={items}
            >
              {(establishment) => (
                <TableRow key={establishment.id}>
                  <TableCell className="font-medium text-theme-primary">{establishment.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <MapPinIcon size={16} />
                      <span className="text-sm text-theme-primary">{establishment.address}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {establishment.photos && establishment.photos.length > 0 ? (
                      <div className="flex gap-1">
                        <div className="w-8 h-8 rounded bg-gray-200 flex items-center justify-center">
                          <span className="text-xs text-gray-500">📷</span>
                        </div>
                        {establishment.photos.length > 1 && (
                          <Chip size="sm" variant="flat">
                            +{establishment.photos.length - 1}
                          </Chip>
                        )}
                      </div>
                    ) : (
                      <span className="text-theme-tertiary">Sem fotos</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {establishment.owner ? (
                      <div>
                        <p className="font-medium text-theme-primary">{establishment.owner.name}</p>
                        <p className="text-sm text-theme-secondary">{establishment.owner.email}</p>
                        <Chip color={establishment.owner.isActive ? "success" : "danger"} variant="flat" size="sm">
                          {establishment.owner.isActive ? "Ativo" : "Inativo"}
                        </Chip>
                      </div>
                    ) : (
                      <span className="text-theme-tertiary">Não definido</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip color={establishment.owner?.isActive ? "success" : "danger"} variant="flat">
                      {establishment.owner?.isActive ? "Ativo" : "Inativo"}
                    </Chip>
                  </TableCell>
                  <TableCell className="text-theme-primary">
                    {new Date(establishment.createdAt).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        onPress={() => handleViewEstablishment(establishment)}
                      >
                        <EyeIcon size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {pages > 1 && (
            <div className="flex justify-center mt-4">
              <Pagination
                total={pages}
                page={page}
                onChange={setPage}
                showControls
              />
            </div>
          )}
        </CardBody>
      </Card>

      {/* Modal de Detalhes do Estabelecimento */}
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="3xl">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Detalhes do Estabelecimento</ModalHeader>
              <ModalBody>
                {selectedEstablishment && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="text-sm font-medium text-theme-tertiary">Nome</label>
                        <p className="text-lg font-medium text-theme-primary">{selectedEstablishment.name}</p>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-theme-tertiary">Endereço</label>
                      <div className="flex items-center gap-2 mt-1">
                        <MapPinIcon size={16} />
                        <p className="text-lg text-theme-primary">{selectedEstablishment.address}</p>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-theme-tertiary">Proprietário</label>
                      {selectedEstablishment.owner ? (
                        <div className="mt-1">
                          <p className="font-medium text-theme-primary">{selectedEstablishment.owner.name}</p>
                          <p className="text-theme-secondary">{selectedEstablishment.owner.email}</p>
                          <Chip color={selectedEstablishment.owner.isActive ? "success" : "danger"} variant="flat" size="sm">
                            {selectedEstablishment.owner.isActive ? "Ativo" : "Inativo"}
                          </Chip>
                        </div>
                      ) : (
                        <p className="text-theme-tertiary mt-1">Não definido</p>
                      )}
                    </div>

                    {selectedEstablishment.photos && selectedEstablishment.photos.length > 0 && (
                      <div>
                        <label className="text-sm font-medium text-theme-tertiary">Fotos</label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                          {selectedEstablishment.photos.map((photo, index) => (
                            <div
                              key={index}
                              className="w-full h-32 bg-gray-200 rounded-lg flex items-center justify-center"
                            >
                              <span className="text-2xl text-gray-500">📷</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="text-sm font-medium text-theme-tertiary">Criado em</label>
                        <p className="text-lg text-theme-primary">{new Date(selectedEstablishment.createdAt).toLocaleString('pt-BR')}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-theme-tertiary">Última atualização</label>
                        <p className="text-lg text-theme-primary">{new Date(selectedEstablishment.updatedAt).toLocaleString('pt-BR')}</p>
                      </div>
                    </div>
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Fechar
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
} 