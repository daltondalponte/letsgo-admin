"use client"
import { useState, useEffect } from "react";
import { Card, CardBody, CardHeader, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Button, Input, Chip, Pagination, useDisclosure, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Select, SelectItem } from "@nextui-org/react";
import { SearchIcon, PlusIcon, EditIcon, TrashIcon, EyeIcon, TicketIcon } from "lucide-react";
import { useAuth } from "@/context/authContext";
import axios from "axios";
import moment from "moment";
import "moment/locale/pt-br";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { registerLocale } from "react-datepicker";
import { ptBR } from 'date-fns/locale/pt-BR';
registerLocale('pt-BR', ptBR);

interface Cupom {
  id: string;
  code: string;
  eventId?: string;
  eventName?: string;
  quantity_available: number;
  descont_percent?: number;
  discount_value?: number;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  description?: string; // Added for editing
  useruid?: string; // Adicionado para controle de permissão
}

export default function CuponsPage() {
  const { user, token } = useAuth();
  const [cupons, setCupons] = useState<Cupom[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [selectedCupom, setSelectedCupom] = useState<Cupom | null>(null);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [myEventIds, setMyEventIds] = useState<string[]>([]);
  
  // Estados para criação de cupom
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newCupom, setNewCupom] = useState({
    code: '',
    discountType: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED',
    discountValue: 0,
    maxUses: 1,
    validUntil: '',
    eventId: '', // valor inicial vazio
    description: ''
  });
  const [isCreating, setIsCreating] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [cupomToDelete, setCupomToDelete] = useState<Cupom | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editCupom, setEditCupom] = useState<Cupom | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Adicionar estados para tipo e valor do desconto na edição
  const [editDiscountType, setEditDiscountType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [editDiscountValue, setEditDiscountValue] = useState<number>(0);

  const rowsPerPage = 10;

  useEffect(() => {
    if (token) {
      fetchCupons();
      fetchEvents();
    }
  }, [token]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const fetchCupons = async () => {
    if (!token) {
      console.error('Token não disponível');
      return;
    }
    try {
      setLoading(true);
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/cupom/findAllByUser`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setCupons(response.data.cupons || []);
    } catch (error) {
      console.error('Erro ao buscar cupons:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    if (!token) {
      console.error('Token não disponível para eventos');
      return;
    }
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/event/find-many-by-user`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setEvents(response.data.events || []);
      setMyEventIds((response.data.events || []).map((e: any) => e.id));
    } catch (error) {
      console.error('Erro ao buscar eventos:', error);
    }
  };

  const filteredCupons = cupons.filter(cupom =>
    cupom.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pages = Math.ceil(filteredCupons.length / rowsPerPage);
  const items = filteredCupons.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const handleViewCupom = (cupom: Cupom) => {
    setSelectedCupom(cupom);
    onOpen();
  };

  const handleToggleStatus = async (cupomId: string, currentStatus: boolean) => {
    try {
      await axios.patch(`${process.env.NEXT_PUBLIC_API_URL}/cupom/toggle-status/${cupomId}`, {
        isActive: !currentStatus
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      fetchCupons();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
    }
  };

  const handleCreateCupom = async () => {
    if (!token) return;
    
    try {
      setIsCreating(true);
      const cupomData: any = {
        code: newCupom.code,
        descont_percent: newCupom.discountType === 'PERCENTAGE' ? newCupom.discountValue : 0,
        discont_value: newCupom.discountType === 'FIXED' ? newCupom.discountValue : 0,
        quantity_available: newCupom.maxUses,
        expiresAt: newCupom.validUntil,
        description: newCupom.description // Added description
      };

      // Só adicionar eventId se não for vazio
      if (newCupom.eventId && newCupom.eventId.trim() !== '') {
        cupomData.eventId = newCupom.eventId;
      }

      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/cupom/create`, cupomData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Limpar formulário e fechar modal
      setNewCupom({
        code: '',
        discountType: 'PERCENTAGE',
        discountValue: 0,
        maxUses: 1,
        validUntil: '',
        eventId: '',
        description: ''
      });
      setIsCreateModalOpen(false);
      setSuccessMessage("Cupom criado com sucesso!");
      
      // Recarregar cupons
      fetchCupons();
    } catch (error) {
      console.error('Erro ao criar cupom:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteCupom = async () => {
    if (!cupomToDelete || !token) return;
    setIsDeleting(true);
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/cupom/delete/${cupomToDelete.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccessMessage('Cupom deletado com sucesso!');
      fetchCupons();
      setIsDeleteModalOpen(false);
      setCupomToDelete(null);
    } catch (error) {
      console.error('Erro ao deletar cupom:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const openEditModal = (cupom: Cupom) => {
    setEditCupom(cupom);
    setEditDiscountType(cupom.descont_percent && cupom.descont_percent > 0 ? 'PERCENTAGE' : 'FIXED');
    setEditDiscountValue(cupom.descont_percent && cupom.descont_percent > 0 ? cupom.descont_percent : (cupom.discount_value || 0));
    setIsEditModalOpen(true);
  };

  const handleEditCupom = async () => {
    if (!editCupom || !token) return;
    setIsEditing(true);
    try {
      const cupomData: any = {
        code: editCupom.code,
        descont_percent: editDiscountType === 'PERCENTAGE' ? Number(editDiscountValue) : 0,
        discount_value: editDiscountType === 'FIXED' ? Number(editDiscountValue) : 0,
        quantity_available: Number(editCupom.quantity_available),
        description: editCupom.description || ""
      };
      
      // DEBUG: Log do cupom original
      console.log('=== DEBUG EDIT CUPOM ===');
      console.log('editCupom original:', editCupom);
      console.log('editCupom.eventId:', editCupom.eventId);
      console.log('typeof editCupom.eventId:', typeof editCupom.eventId);
      console.log('editDiscountType:', editDiscountType);
      console.log('editDiscountValue:', editDiscountValue);
      console.log('descont_percent será:', editDiscountType === 'PERCENTAGE' ? Number(editDiscountValue) : 0);
      console.log('discount_value será:', editDiscountType === 'FIXED' ? Number(editDiscountValue) : 0);
      
      // Corrigido: sempre enviar eventId como string se existir, ou não enviar
      if (editCupom.eventId !== undefined && editCupom.eventId !== null && String(editCupom.eventId).trim() !== '') {
        cupomData.eventId = String(editCupom.eventId);
        console.log('eventId será enviado:', cupomData.eventId);
      } else {
        console.log('eventId NÃO será enviado (undefined/null/vazio)');
      }
      
      console.log('cupomData final:', cupomData);
      
      await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/cupom/update?id=${editCupom.id}`, cupomData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccessMessage('Cupom editado com sucesso!');
      fetchCupons();
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Erro ao editar cupom:', error);
    } finally {
      setIsEditing(false);
    }
  };

  const formatDiscount = (cupom: Cupom) => {
    if (cupom.descont_percent && cupom.descont_percent > 0) {
      return `${cupom.descont_percent}%`;
    } else if (cupom.discount_value && cupom.discount_value > 0) {
      return `R$ ${cupom.discount_value.toLocaleString('pt-BR')}`;
    } else {
      return "Sem desconto";
    }
  };

  const isExpired = (expiresAt: string) => {
    return moment(expiresAt).isBefore(moment());
  };

  const isActive = (cupom: Cupom) => {
    return !isExpired(cupom.expiresAt);
  };

  // Função utilitária para saber se o cupom pode ser editado/deletado pelo usuário logado
  const canEditOrDeleteCupom = (cupom: Cupom) => {
    // Cupom de evento do usuário
    if (cupom.eventId && myEventIds.includes(cupom.eventId)) return true;
    // Cupom global criado pelo usuário
    if (!cupom.eventId && (cupom as any).useruid === user?.uid) return true;
    return false;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Gestão de Cupons</h1>
        <Button color="primary" startContent={<PlusIcon size={20} />} onPress={() => setIsCreateModalOpen(true)}>
          Novo Cupom
        </Button>
      </div>

      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">{successMessage}</p>
            </div>
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button
                  onClick={() => setSuccessMessage("")}
                  className="inline-flex bg-green-50 rounded-md p-1.5 text-green-500 hover:bg-green-100"
                >
                  <span className="sr-only">Dismiss</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <Input
            placeholder="Buscar cupons..."
            startContent={<SearchIcon size={20} />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </CardHeader>
        <CardBody>
          <Table aria-label="Tabela de cupons">
            <TableHeader>
              <TableColumn>CÓDIGO</TableColumn>
              <TableColumn>DESCONTO</TableColumn>
              <TableColumn>EVENTO</TableColumn>
              <TableColumn>QUANTIDADE</TableColumn>
              <TableColumn>VALIDADE</TableColumn>
              <TableColumn>STATUS</TableColumn>
              <TableColumn>AÇÕES</TableColumn>
            </TableHeader>
            <TableBody
              emptyContent={loading ? "Carregando..." : "Nenhum cupom encontrado"}
              items={items}
            >
              {(cupom) => (
                <TableRow key={cupom.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <TicketIcon size={16} />
                      <span className="font-mono font-medium">{cupom.code}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-bold text-green-600">
                      {formatDiscount(cupom)}
                    </span>
                  </TableCell>
                  <TableCell>
                    {cupom.eventName || "Todos os eventos"}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {cupom.quantity_available}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p>Até {moment(cupom.expiresAt).format('DD/MM/YYYY')}</p>
                      {isExpired(cupom.expiresAt) && (
                        <Chip size="sm" color="danger" variant="flat">Expirado</Chip>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      color={isActive(cupom) ? "success" : "danger"} 
                      variant="flat"
                    >
                      {isActive(cupom) ? "Ativo" : "Inativo"}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        onPress={() => handleViewCupom(cupom)}
                      >
                        <EyeIcon size={16} />
                      </Button>
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        color="warning"
                        isDisabled={!canEditOrDeleteCupom(cupom)}
                        onPress={() => openEditModal(cupom)}
                      >
                        <EditIcon size={16} />
                      </Button>
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        color="danger"
                        isDisabled={!canEditOrDeleteCupom(cupom)}
                        onPress={() => { setCupomToDelete(cupom); setIsDeleteModalOpen(true); }}
                      >
                        <TrashIcon size={16} />
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

      {/* Modal de Detalhes do Cupom */}
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Detalhes do Cupom</ModalHeader>
              <ModalBody>
                {selectedCupom && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Código</label>
                      <p className="text-lg font-mono font-bold">{selectedCupom.code}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Tipo de Desconto</label>
                        <Chip variant="flat">
                          {selectedCupom.descont_percent ? "Percentual" : "Valor Fixo"}
                        </Chip>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Valor do Desconto</label>
                        <p className="text-lg font-bold text-green-600">
                          {formatDiscount(selectedCupom)}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Quantidade Disponível</label>
                        <p className="text-lg">
                          {selectedCupom.quantity_available} cupons
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Evento</label>
                        <p className="text-lg">{selectedCupom.eventName || "Todos os eventos"}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Criado em</label>
                        <p className="text-lg">{moment(selectedCupom.createdAt).format('DD/MM/YYYY HH:mm')}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Válido até</label>
                        <p className="text-lg">{moment(selectedCupom.expiresAt).format('DD/MM/YYYY HH:mm')}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Válido até</label>
                        <p className="text-lg">{moment(selectedCupom.expiresAt).format('DD/MM/YYYY HH:mm')}</p>
                      </div>
                    </div>

                    {isExpired(selectedCupom.expiresAt) && (
                      <div className="bg-red-50 p-4 rounded-lg">
                        <p className="text-red-800 font-medium">Este cupom expirou!</p>
                      </div>
                    )}
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

      {/* Modal de Criação de Cupom */}
      <Modal isOpen={isCreateModalOpen} onOpenChange={setIsCreateModalOpen} size="2xl">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Criar Novo Cupom</ModalHeader>
              <ModalBody>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Código do Cupom"
                      placeholder="Ex: DESCONTO10"
                      value={newCupom.code}
                      onChange={(e) => setNewCupom({...newCupom, code: e.target.value})}
                      isRequired
                    />
                    <Input
                      label="Descrição"
                      placeholder="Descrição do cupom"
                      value={newCupom.description}
                      onChange={(e) => setNewCupom({...newCupom, description: e.target.value})}
                      isRequired
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Select
                      label="Tipo de Desconto"
                      selectedKeys={[String(newCupom.discountType)]}
                      onChange={(e) => setNewCupom({...newCupom, discountType: e.target.value as 'PERCENTAGE' | 'FIXED'})}
                      isRequired
                    >
                      <SelectItem key="PERCENTAGE" value="PERCENTAGE">Percentual (%)</SelectItem>
                      <SelectItem key="FIXED" value="FIXED">Valor Fixo (R$)</SelectItem>
                    </Select>
                    <Input
                      label="Valor do Desconto"
                      type="number"
                      placeholder={newCupom.discountType === 'PERCENTAGE' ? '10' : '50'}
                      value={String(newCupom.discountValue)}
                      onChange={(e) => setNewCupom({...newCupom, discountValue: Number(e.target.value)})}
                      isRequired
                    />
                    <Input
                      label="Número Máximo de Usos"
                      type="number"
                      placeholder="100"
                      value={String(newCupom.maxUses)}
                      onChange={(e) => setNewCupom({...newCupom, maxUses: Number(e.target.value)})}
                      isRequired
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select
                      label="Evento (Opcional)"
                      placeholder="Selecione um evento específico"
                      selectedKeys={typeof newCupom.eventId === 'string' ? [newCupom.eventId] : ['']}
                      onChange={(e) => setNewCupom({...newCupom, eventId: e.target.value})}
                    >
                      <SelectItem key="" value="">Todos os eventos</SelectItem>
                      {events.map((event) => (
                        <SelectItem key={event.id} value={event.id}>
                          {event.name}
                        </SelectItem>
                      ))}
                    </Select>
                    <DatePicker
                      selected={newCupom.validUntil ? new Date(newCupom.validUntil) : null}
                      onChange={date => setNewCupom({ ...newCupom, validUntil: date ? (date as Date).toISOString() : '' })}
                      showTimeSelect
                      timeFormat="HH:mm"
                      timeIntervals={15}
                      dateFormat="dd/MM/yyyy HH:mm"
                      placeholderText="Selecione a data e hora"
                      className="w-full px-4 py-3 rounded-md border border-default-200 text-theme-primary bg-white shadow-sm focus:ring-2 focus:ring-accent-primary"
                      locale="pt-BR"
                    />
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Cancelar
                </Button>
                <Button 
                  color="primary" 
                  onPress={handleCreateCupom}
                  isLoading={isCreating}
                  isDisabled={!newCupom.code || !newCupom.description || !newCupom.validUntil}
                >
                  Criar Cupom
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Modal de Edição de Cupom */}
      <Modal isOpen={isEditModalOpen} onOpenChange={setIsEditModalOpen} size="2xl">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Editar Cupom</ModalHeader>
              <ModalBody>
                {editCupom && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Código do Cupom"
                        value={editCupom.code}
                        onChange={(e) => setEditCupom({ ...editCupom, code: e.target.value })}
                        isRequired
                      />
                      <Input
                        label="Descrição"
                        value={editCupom.description || ''}
                        onChange={(e) => setEditCupom({ ...editCupom, description: e.target.value })}
                        isRequired
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Select
                        label="Tipo de Desconto"
                        selectedKeys={[editDiscountType]}
                        onChange={(e) => setEditDiscountType(e.target.value as 'PERCENTAGE' | 'FIXED')}
                        isRequired
                      >
                        <SelectItem key="PERCENTAGE" value="PERCENTAGE">Percentual (%)</SelectItem>
                        <SelectItem key="FIXED" value="FIXED">Valor Fixo (R$)</SelectItem>
                      </Select>
                      <Input
                        label="Valor do Desconto"
                        type="number"
                        value={String(editDiscountValue)}
                        onChange={(e) => setEditDiscountValue(Number(e.target.value))}
                        isRequired
                      />
                      <Input
                        label="Número Máximo de Usos"
                        type="number"
                        value={String(editCupom.quantity_available)}
                        onChange={(e) => setEditCupom({ ...editCupom, quantity_available: Number(e.target.value) })}
                        isRequired
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Select
                        label="Evento (Opcional)"
                        selectedKeys={editCupom.eventId ? [editCupom.eventId] : [""]}
                        onChange={(e) => setEditCupom({ ...editCupom, eventId: e.target.value })}
                      >
                        <SelectItem key="" value="">Todos os eventos</SelectItem>
                        {events.map((event) => (
                          <SelectItem key={event.id} value={event.id}>
                            {event.name}
                          </SelectItem>
                        ))}
                      </Select>
                      {editCupom && (
                        <DatePicker
                          selected={editCupom.expiresAt ? new Date(editCupom.expiresAt) : null}
                          onChange={date => setEditCupom({ ...editCupom, expiresAt: date ? (date as Date).toISOString() : '' })}
                          showTimeSelect
                          timeFormat="HH:mm"
                          timeIntervals={15}
                          dateFormat="dd/MM/yyyy HH:mm"
                          placeholderText="Selecione a data e hora"
                          className="w-full px-4 py-3 rounded-md border border-default-200 text-theme-primary bg-white shadow-sm focus:ring-2 focus:ring-accent-primary"
                          locale="pt-BR"
                        />
                      )}
                    </div>
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button color="default" variant="flat" onPress={onClose} isDisabled={isEditing}>
                  Cancelar
                </Button>
                <Button color="primary" onPress={handleEditCupom} isLoading={isEditing}>
                  Salvar Alterações
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Modal de confirmação de deleção */}
      <Modal isOpen={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen} size="md">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Confirmar deleção</ModalHeader>
              <ModalBody>
                <p>Tem certeza que deseja deletar o cupom <b>{cupomToDelete?.code}</b>?</p>
              </ModalBody>
              <ModalFooter>
                <Button color="default" variant="flat" onPress={onClose} isDisabled={isDeleting}>
                  Cancelar
                </Button>
                <Button color="danger" onPress={handleDeleteCupom} isLoading={isDeleting}>
                  Deletar
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
} 