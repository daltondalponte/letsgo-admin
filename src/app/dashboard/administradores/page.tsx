"use client"
import { useState, useEffect } from "react";
import { Card, CardBody, CardHeader, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Button, Input, Chip, Pagination, useDisclosure, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Spinner, Select, SelectItem } from "@nextui-org/react";
import { SearchIcon, PlusIcon, TrashIcon, EyeIcon, UserIcon } from "lucide-react";
import { useAuth } from "@/context/authContext";
import axios from "axios";

interface TicketTaker {
  uid: string;
  name: string;
  email: string;
  type: string;
  isActive: boolean;
  createdAt: string;
}

export default function AdministradoresPage() {
  const { token, user } = useAuth();
  
  const [ticketTakers, setTicketTakers] = useState<TicketTaker[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [selectedTaker, setSelectedTaker] = useState<TicketTaker | null>(null);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [takerToDelete, setTakerToDelete] = useState<TicketTaker | null>(null);
  
  // Estados para modais de feedback
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [isErrorOpen, setIsErrorOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  
  // Estados para busca de TICKETTAKER existentes
  const [searchExistingOpen, setSearchExistingOpen] = useState(false);
  const [searchModalTerm, setSearchModalTerm] = useState("");
  const [searchResults, setSearchResults] = useState<TicketTaker[]>([]);
  const [searching, setSearching] = useState(false);
  
  // Form para criar novo administrador
  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    password: ""
  });

  const rowsPerPage = 10;

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  const fetchData = async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      // Buscar todos os usuários do tipo TICKETTAKER
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/ticket-takers`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setTicketTakers(response.data.ticketTakers || []);
      
    } catch (error: any) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTakers = ticketTakers.filter(taker =>
    taker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    taker.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pages = Math.ceil(filteredTakers.length / rowsPerPage);
  const items = filteredTakers.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const handleViewTaker = (taker: TicketTaker) => {
    setSelectedTaker(taker);
    onOpen();
  };

  const handleCreateTaker = async () => {
    // Validações mais específicas
    if (!createForm.name.trim()) {
      setErrorMessage('Nome é obrigatório.');
      setIsErrorOpen(true);
      return;
    }

    if (!createForm.email.trim()) {
      setErrorMessage('Email é obrigatório.');
      setIsErrorOpen(true);
      return;
    }

    if (!createForm.password.trim()) {
      setErrorMessage('Senha é obrigatória.');
      setIsErrorOpen(true);
      return;
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(createForm.email.trim())) {
      setErrorMessage('Formato de email inválido.');
      setIsErrorOpen(true);
      return;
    }

    // Validar tamanho mínimo da senha
    if (createForm.password.trim().length < 6) {
      setErrorMessage('Senha deve ter pelo menos 6 caracteres.');
      setIsErrorOpen(true);
      return;
    }

    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/create-ticket-taker`, {
        name: createForm.name.trim(),
        email: createForm.email.trim(),
        password: createForm.password
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      // Recarregar dados
      await fetchData();
      
      // Limpar formulário
      setCreateForm({
        name: "",
        email: "",
        password: ""
      });
      
      setIsCreateOpen(false);
      // Usar a mensagem retornada pela API
      setSuccessMessage(response.data.message || 'Operação realizada com sucesso!');
      setIsSuccessOpen(true);
      
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || 'Erro ao criar administrador';
      setErrorMessage(`Erro: ${errorMsg}`);
      setIsErrorOpen(true);
    }
  };

  const handleDeleteTaker = async () => {
    if (!takerToDelete) return;

    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/unlink/${takerToDelete.uid}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      // Recarregar dados
      await fetchData();
      
      setIsDeleteOpen(false);
      setTakerToDelete(null);
      setSuccessMessage('Administrador desvinculado com sucesso!');
      setIsSuccessOpen(true);
      
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || 'Erro ao desvincular administrador';
      setErrorMessage(`Erro: ${errorMsg}`);
      setIsErrorOpen(true);
    }
  };

  const confirmDelete = (taker: TicketTaker) => {
    setTakerToDelete(taker);
    setIsDeleteOpen(true);
  };

  const searchExistingTicketTakers = async () => {
    if (!searchModalTerm.trim()) {
      setErrorMessage('Digite um nome ou email para buscar.');
      setIsErrorOpen(true);
      return;
    }

    setSearching(true);
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/search-ticket-takers?q=${encodeURIComponent(searchModalTerm.trim())}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setSearchResults(response.data.ticketTakers || []);
      
      if (response.data.ticketTakers?.length === 0) {
        setSuccessMessage('Nenhum administrador encontrado com este termo.');
        setIsSuccessOpen(true);
      }
      
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || 'Erro ao buscar administradores';
      setErrorMessage(`Erro: ${errorMsg}`);
      setIsErrorOpen(true);
    } finally {
      setSearching(false);
    }
  };

  const linkExistingTicketTaker = async (takerId: string) => {
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/link-ticket-taker`, {
        ticketTakerId: takerId
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      // Recarregar dados
      await fetchData();
      
      setSearchExistingOpen(false);
      setSearchModalTerm("");
      setSearchResults([]);
      // Usar a mensagem retornada pela API
      setSuccessMessage(response.data.message || 'Administrador vinculado com sucesso!');
      setIsSuccessOpen(true);
      
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || 'Erro ao vincular administrador';
      setErrorMessage(`Erro: ${errorMsg}`);
      setIsErrorOpen(true);
    }
  };

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

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Administradores de Eventos</h1>
          <p className="text-sm text-gray-600 mt-1">
            Gerencie os administradores que podem validar ingressos nos seus eventos
          </p>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Buscar administradores..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
            startContent={<SearchIcon className="w-4 h-4 text-gray-400" />}
          />
          <Button
            color="secondary"
            startContent={<SearchIcon className="w-4 h-4" />}
            onPress={() => setSearchExistingOpen(true)}
          >
            Buscar Existentes
          </Button>
          <Button
            color="primary"
            startContent={<PlusIcon className="w-4 h-4" />}
            onPress={() => setIsCreateOpen(true)}
          >
            Criar Novo
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          <Table aria-label="Tabela de administradores de eventos">
            <TableHeader>
              <TableColumn>NOME</TableColumn>
              <TableColumn>EMAIL</TableColumn>
              <TableColumn>STATUS</TableColumn>
              <TableColumn>DATA CRIAÇÃO</TableColumn>
              <TableColumn>AÇÕES</TableColumn>
            </TableHeader>
            <TableBody>
              {items.map((taker) => (
                <TableRow key={taker.uid}>
                  <TableCell>
                    <div className="flex flex-col">
                      <p className="text-bold">{taker.name}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <p className="text-bold text-small">{taker.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Chip
                      className="capitalize"
                      color={taker.isActive ? "success" : "danger"}
                      size="sm"
                      variant="flat"
                    >
                      {taker.isActive ? "Ativo" : "Inativo"}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <p className="text-bold text-small">
                        {new Date(taker.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                      <p className="text-tiny text-gray-500">
                        {new Date(taker.createdAt).toLocaleTimeString('pt-BR')}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="flat"
                        onPress={() => handleViewTaker(taker)}
                      >
                        Ver
                      </Button>
                      <Button
                        size="sm"
                        color="danger"
                        variant="flat"
                        onPress={() => confirmDelete(taker)}
                      >
                        Desvincular
                      </Button>
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

      {/* Modal de Busca de TICKETTAKER Existentes */}
      <Modal isOpen={searchExistingOpen} onOpenChange={setSearchExistingOpen} size="3xl">
        <ModalContent>
          <ModalHeader>Buscar Administradores Existentes</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <p className="text-sm text-gray-600 mb-4">
                Digite o nome ou email do administrador que você deseja vincular ao seu perfil.
              </p>
              
              <div className="flex gap-2">
                <Input
                  placeholder="Digite nome ou email..."
                  value={searchModalTerm}
                  onChange={(e) => setSearchModalTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchExistingTicketTakers()}
                />
                <Button
                  color="primary"
                  onPress={searchExistingTicketTakers}
                  isLoading={searching}
                >
                  Buscar
                </Button>
              </div>

              {searchResults.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-lg font-semibold mb-3">Resultados da Busca:</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {searchResults.map((taker) => (
                      <div key={taker.uid} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{taker.name}</p>
                          <p className="text-sm text-gray-600">{taker.email}</p>
                          <p className="text-xs text-gray-500">
                            Criado em: {new Date(taker.createdAt).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          color="primary"
                          variant="flat"
                          onPress={() => linkExistingTicketTaker(taker.uid)}
                        >
                          Vincular
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="default" variant="flat" onPress={() => setSearchExistingOpen(false)}>
              Fechar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal de Visualização */}
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl">
        <ModalContent>
          <ModalHeader>Detalhes do Administrador</ModalHeader>
          <ModalBody>
            {selectedTaker && (
              <div className="space-y-4">
                <div>
                  <strong>Nome:</strong> {selectedTaker.name}
                </div>
                <div>
                  <strong>Email:</strong> {selectedTaker.email}
                </div>
                <div>
                  <strong>Tipo:</strong> {selectedTaker.type}
                </div>
                <div>
                  <strong>Status:</strong> {selectedTaker.isActive ? "Ativo" : "Inativo"}
                </div>
                <div>
                  <strong>Data de Criação:</strong> {new Date(selectedTaker.createdAt).toLocaleString('pt-BR')}
                </div>
              </div>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Modal de Criação de Novo TICKETTAKER */}
      <Modal isOpen={isCreateOpen} onOpenChange={setIsCreateOpen} size="2xl">
        <ModalContent>
          <ModalHeader>Criar Novo Administrador</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <p className="text-sm text-gray-600 mb-4">
                Crie um novo administrador de eventos. Este administrador será criado no sistema e vinculado ao seu perfil.
              </p>
              
              <Input
                label="Nome do Administrador"
                placeholder="Digite o nome completo"
                value={createForm.name}
                onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                isRequired
              />
              
              <Input
                label="Email"
                placeholder="Digite o email"
                value={createForm.email}
                onChange={(e) => setCreateForm(prev => ({ ...prev, email: e.target.value }))}
                isRequired
              />

              <Input
                label="Senha"
                type="password"
                placeholder="Digite a senha"
                value={createForm.password}
                onChange={(e) => setCreateForm(prev => ({ ...prev, password: e.target.value }))}
                isRequired
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="flat" onPress={() => setIsCreateOpen(false)}>
              Cancelar
            </Button>
            <Button color="primary" onPress={handleCreateTaker}>
              Criar Administrador
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal de Confirmação de Desvinculação */}
      <Modal isOpen={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <ModalContent>
          <ModalHeader>Confirmar Desvinculação</ModalHeader>
          <ModalBody>
            <p>
              Tem certeza que deseja desvincular o administrador{" "}
              <strong>{takerToDelete?.name}</strong>?
            </p>
            <p className="text-sm text-gray-500 mt-2">
              O administrador continuará no sistema, mas não estará mais vinculado ao seu perfil.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button color="default" variant="flat" onPress={() => setIsDeleteOpen(false)}>
              Cancelar
            </Button>
            <Button color="danger" onPress={handleDeleteTaker}>
              Confirmar Desvinculação
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal de Sucesso */}
      <Modal isOpen={isSuccessOpen} onOpenChange={setIsSuccessOpen}>
        <ModalContent>
          <ModalHeader className="flex gap-1">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              Sucesso
            </div>
          </ModalHeader>
          <ModalBody>
            <p className="text-gray-700">{successMessage}</p>
          </ModalBody>
          <ModalFooter>
            <Button color="primary" onPress={() => setIsSuccessOpen(false)}>
              OK
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal de Erro */}
      <Modal isOpen={isErrorOpen} onOpenChange={setIsErrorOpen}>
        <ModalContent>
          <ModalHeader className="flex gap-1">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              </div>
              Erro
            </div>
          </ModalHeader>
          <ModalBody>
            <p className="text-gray-700">{errorMessage}</p>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" onPress={() => setIsErrorOpen(false)}>
              OK
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
} 