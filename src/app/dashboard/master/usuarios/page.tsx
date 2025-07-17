"use client"
import { useState, useEffect } from "react";
import { Card, CardBody, CardHeader, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Button, Input, Chip, Pagination, useDisclosure, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Spinner } from "@nextui-org/react";
import { SearchIcon, PlusIcon, EditIcon, TrashIcon, EyeIcon, PowerIcon, MapPinIcon } from "lucide-react";
import { RefreshCw } from "lucide-react";
import { useAuth } from "@/context/authContext";
import axios from "axios";
import GoogleAutocomplete from "@/components/GoogleAutocomplete";
import CustomDrawer, { CustomDrawerHeader, CustomDrawerBody, CustomDrawerFooter } from "@/components/Drawer/CustomDrawer";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  name: string;
  email: string;
  type: "MASTER" | "PROFESSIONAL_OWNER" | "PROFESSIONAL_PROMOTER" | "PERSONAL";
  establishment?: {
    id: string;
    name: string;
    address: string;
    coordinates: string | { lat: number; lng: number };
  };
  createdAt: string;
  isActive: boolean;
}

export default function UsuariosPage() {
  const { token } = useAuth();
  const router = useRouter();
  
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({
    establishmentName: "",
    establishmentAddress: "",
    coordinates: null as { latitude: number; longitude: number } | null
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isAutocompleteActive, setIsAutocompleteActive] = useState(false);

  // Função customizada para controlar o fechamento do modal
  const handleEditModalChange = (open: boolean) => {
    if (isSaving) {
      return;
    }
    
    if (!open && isAutocompleteActive) {
      return;
    }
    
    setIsEditOpen(open);
    
    if (!open) {
      setIsAutocompleteActive(false);
    }
  };

  const rowsPerPage = 10;

  // Função para ordenar usuários por data de cadastro (mais antigos primeiro)
  const sortUsersByCreatedAt = (usersList: User[]) => {
    return usersList.sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  };

  useEffect(() => {
    if (token) {
      fetchUsers();
    }
  }, [token]);

  const fetchUsers = async () => {
    if (!token) {
      return;
    }
    setLoading(true);

    try {
      // Buscar usuários detalhados (incluindo estabelecimentos)
      const response = await axios.get('/api/admin/users/professionals-detailed', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Buscar todos os usuários para ter a lista completa
      const allUsersResponse = await axios.get('/api/admin/users/all', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Criar um mapa dos estabelecimentos por usuário
      const establishmentMap = new Map();
      if (response.data.professionals) {
        response.data.professionals.forEach((item: any) => {
          if (item.establishment) {
            establishmentMap.set(item.user.uid, item.establishment);
          }
        });
      }
      
      // Mapear os dados da API para o formato esperado pelo frontend
      const apiUsers = allUsersResponse.data.users.map((user: any) => {
        const establishment = establishmentMap.get(user.uid);
        
        return {
          id: user.uid, // Usar uid como id
          name: user.name,
          email: user.email,
          type: user.type,
          createdAt: user.createdAt,
          isActive: user.isActive,
          establishment: establishment || null
        };
      });
      
      // Ordenar por data de cadastro (mais antigos primeiro)
      const sortedUsers = sortUsersByCreatedAt(apiUsers);
      
      setUsers(sortedUsers);
    } catch (error: any) {
      setUsers([]);
      // Exibir mensagem de erro se necessário
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pages = Math.ceil(filteredUsers.length / rowsPerPage);
  const items = filteredUsers.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  // Mostrar erro se não estiver autenticado
  if (!token) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <p className="text-red-500">Você não está autenticado.</p>
          <p>Faça login para acessar esta página.</p>
        </div>
      </div>
    );
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "MASTER": return "danger";
      case "PROFESSIONAL_OWNER": return "warning";
      case "PROFESSIONAL_PROMOTER": return "warning";
      case "PERSONAL": return "default";
      default: return "default";
    }
  };

  const truncateAddress = (address: string, maxLength: number = 30) => {
    if (address.length <= maxLength) {
      return address;
    }
    return address.substring(0, maxLength) + "...";
  };

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    onOpen();
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    // Verificar se o usuário é do tipo PROFESSIONAL_OWNER ou PROFESSIONAL_PROMOTER
    const user = users.find(u => u.id === userId);
    if (!user || (user.type !== "PROFESSIONAL_OWNER" && user.type !== "PROFESSIONAL_PROMOTER")) {
      return;
    }

    if (!token) {
      alert('Erro: Token de acesso não encontrado. Faça login novamente.');
      return;
    }

    try {
      await axios.put(`/api/admin/users/professionals/${userId}/status`, {
        state: !currentStatus
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Recarregar os dados da API para garantir sincronização
      await fetchUsers();
      
    } catch (error) {
      // Em caso de erro, ainda tentar recarregar os dados
      try {
        await fetchUsers();
      } catch (reloadError) {
        console.error('Erro ao recarregar dados:', reloadError);
      }
    }
  };

  const handleEditUser = (user: User) => {
    if ((user.type === "PROFESSIONAL_OWNER" || user.type === "PROFESSIONAL_PROMOTER") && user.establishment) {
      setEditingUser(user);
      
      // Tratar coordenadas com segurança
      let coordinates = null;
      if (user.establishment.coordinates) {
        try {
          let parsedCoordinates;
          // Se as coordenadas já são um objeto, usar diretamente
          if (typeof user.establishment.coordinates === 'object') {
            parsedCoordinates = user.establishment.coordinates;
          } else if (typeof user.establishment.coordinates === 'string') {
            // Tentar fazer parse se for string JSON
            parsedCoordinates = JSON.parse(user.establishment.coordinates);
          } else {
            parsedCoordinates = null;
          }
          
          // Normalizar para o formato correto { latitude, longitude }
          if (parsedCoordinates) {
            if ('latitude' in parsedCoordinates && 'longitude' in parsedCoordinates) {
              coordinates = {
                latitude: Number(parsedCoordinates.latitude),
                longitude: Number(parsedCoordinates.longitude)
              };
            } else if ('lat' in parsedCoordinates && 'lng' in parsedCoordinates) {
              coordinates = {
                latitude: Number(parsedCoordinates.lat),
                longitude: Number(parsedCoordinates.lng)
              };
            }
          }
        } catch (error) {
          // Se as coordenadas estão no formato "lat,lng", converter para objeto
          if (typeof user.establishment.coordinates === 'string' && user.establishment.coordinates.includes(',')) {
            const [lat, lng] = user.establishment.coordinates.split(',');
            coordinates = { 
              latitude: parseFloat(lat), 
              longitude: parseFloat(lng) 
            };
          }
        }
      }
      
      setEditForm({
        establishmentName: user.establishment.name,
        establishmentAddress: user.establishment.address,
        coordinates: coordinates
      });
      setIsEditOpen(true);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingUser || !editingUser.establishment) return;

    // Validação básica
    if (!editForm.establishmentName.trim() || !editForm.establishmentAddress.trim()) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    setIsSaving(true);

    try {
      // Preparar dados para envio
      const updateData = {
        name: editForm.establishmentName.trim(),
        address: editForm.establishmentAddress.trim(),
        coordinates: editForm.coordinates
          ? {
              latitude: editForm.coordinates.latitude,
              longitude: editForm.coordinates.longitude
            }
          : undefined
      };

      const response = await axios.put(
        `/api/establishment/admin/update/${editingUser.establishment.id}`, 
        updateData,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      // Atualizar localmente
      setUsers(prevUsers => {
        const updatedUsers = prevUsers.map(user => 
          user.id === editingUser.id 
            ? {
                ...user,
                establishment: {
                  ...user.establishment!,
                  name: editForm.establishmentName.trim(),
                  address: editForm.establishmentAddress.trim(),
                  coordinates: editForm.coordinates ? JSON.stringify(editForm.coordinates) : user.establishment!.coordinates
                }
              }
            : user
        );
        return sortUsersByCreatedAt(updatedUsers);
      });
      
      // Feedback de sucesso
      alert('Estabelecimento atualizado com sucesso!');
      setIsEditOpen(false);
      
      // Limpar formulário
      setEditForm({
        establishmentName: "",
        establishmentAddress: "",
        coordinates: null
      });
      
    } catch (error: any) {
      // Feedback de erro mais detalhado
      const errorMessage = error.response?.data?.message || error.message || 'Erro desconhecido ao atualizar estabelecimento';
      alert(`Erro ao atualizar estabelecimento: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestão de Usuários</h1>
        <div className="flex gap-2">
          <Input
            placeholder="Buscar usuários..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
            startContent={<SearchIcon className="w-4 h-4 text-gray-400" />}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          <Table aria-label="Tabela de usuários">
            <TableHeader>
              <TableColumn>NOME</TableColumn>
              <TableColumn>EMAIL</TableColumn>
              <TableColumn>TIPO</TableColumn>
              <TableColumn>ESTABELECIMENTO</TableColumn>
              <TableColumn>STATUS</TableColumn>
              <TableColumn>DATA CADASTRO</TableColumn>
              <TableColumn>AÇÕES</TableColumn>
            </TableHeader>
            <TableBody>
              {items.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <p className="text-bold">{user.name}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <p className="text-bold text-small capitalize">{user.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Chip
                      className="capitalize"
                      color={getTypeColor(user.type) as any}
                      size="sm"
                      variant="flat"
                    >
                      {user.type.replace('_', ' ')}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    {user.establishment ? (
                      <div className="flex flex-col max-h-12 overflow-hidden">
                        <p className="text-bold text-small leading-tight">{user.establishment.name}</p>
                        <p className="text-tiny text-gray-500 leading-tight" title={user.establishment.address}>
                          {truncateAddress(user.establishment.address)}
                        </p>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      className="capitalize"
                      color={user.isActive ? "success" : "danger"}
                      size="sm"
                      variant="flat"
                    >
                      {user.isActive ? "Ativo" : "Inativo"}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <p className="text-bold text-small">
                        {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                      <p className="text-tiny text-gray-500">
                        {new Date(user.createdAt).toLocaleTimeString('pt-BR')}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="flat"
                        onPress={() => handleViewUser(user)}
                      >
                        Ver
                      </Button>
                      
                      {(user.type === "PROFESSIONAL_OWNER" || user.type === "PROFESSIONAL_PROMOTER") && (
                        <>
                          <Button
                            size="sm"
                            color={user.isActive ? "danger" : "success"}
                            variant="flat"
                            onPress={() => handleToggleUserStatus(user.id, user.isActive)}
                          >
                            {user.isActive ? "Desativar" : "Ativar"}
                          </Button>
                          {user.establishment && (
                            <Button
                              size="sm"
                              color="primary"
                              variant="flat"
                              onPress={() => router.push(`/dashboard/master/usuarios/editar/${user.id}`)}
                            >
                              Editar
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex justify-center mt-4">
            <Pagination
              total={pages}
              page={page}
              onChange={setPage}
              showControls
              showShadow
            />
          </div>
        </>
      )}

      {/* Modal de Visualização */}
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl">
        <ModalContent>
          <ModalHeader>Detalhes do Usuário</ModalHeader>
          <ModalBody>
            {selectedUser && (
              <div className="space-y-4">
                <div>
                  <strong>Nome:</strong> {selectedUser.name}
                </div>
                <div>
                  <strong>Email:</strong> {selectedUser.email}
                </div>
                <div>
                  <strong>Tipo:</strong> {selectedUser.type.replace('_', ' ')}
                </div>
                <div>
                  <strong>Status:</strong> {selectedUser.isActive ? "Ativo" : "Inativo"}
                </div>
                <div>
                  <strong>Data de Cadastro:</strong> {new Date(selectedUser.createdAt).toLocaleString('pt-BR')}
                </div>
                {selectedUser.establishment && (
                  <>
                    <div>
                      <strong>Estabelecimento:</strong> {selectedUser.establishment.name}
                    </div>
                    <div>
                      <strong>Endereço:</strong> {selectedUser.establishment.address}
                    </div>
                  </>
                )}
              </div>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Drawer de Edição */}
      <CustomDrawer isOpen={isEditOpen} onClose={() => setIsEditOpen(false)}>
        <CustomDrawerHeader>Editar Estabelecimento</CustomDrawerHeader>
        <CustomDrawerBody>
          <div className="space-y-4">
            <Input
              label="Nome do Estabelecimento"
              value={editForm.establishmentName}
              onChange={(e) => setEditForm(prev => ({ ...prev, establishmentName: e.target.value }))}
            />
            <GoogleAutocomplete
              label="Endereço"
              value={editForm.establishmentAddress}
              onChange={(address, coordinates) => {
                setEditForm(prev => ({
                  ...prev,
                  establishmentAddress: address,
                  coordinates: coordinates
                    ? { latitude: coordinates.lat, longitude: coordinates.lng }
                    : prev.coordinates
                }));
              }}
              placeholder="Digite o endereço do estabelecimento..."
              onAutocompleteActive={setIsAutocompleteActive}
            />
            {editForm.coordinates && (
              <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                <strong>Coordenadas detectadas:</strong><br />
                Latitude: {typeof editForm.coordinates.latitude === 'number' ? editForm.coordinates.latitude.toFixed(6) : 'N/A'}<br />
                Longitude: {typeof editForm.coordinates.longitude === 'number' ? editForm.coordinates.longitude.toFixed(6) : 'N/A'}
              </div>
            )}
          </div>
        </CustomDrawerBody>
        <CustomDrawerFooter>
          <Button 
            color="danger" 
            variant="flat" 
            onPress={() => setIsEditOpen(false)}
            isDisabled={isSaving}
          >
            Cancelar
          </Button>
          <Button 
            color="primary" 
            onPress={handleSaveEdit}
            isLoading={isSaving}
            isDisabled={isSaving}
          >
            {isSaving ? "Salvando..." : "Salvar"}
          </Button>
        </CustomDrawerFooter>
      </CustomDrawer>
    </div>
  );
} 