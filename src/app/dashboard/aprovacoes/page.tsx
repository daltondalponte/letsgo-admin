"use client"
import { useState, useEffect } from "react";
import { Card, CardBody, CardHeader, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Button, Input, Chip, Pagination, useDisclosure, Spinner } from "@nextui-org/react";
import { SearchIcon, CheckIcon, XIcon, EyeIcon, CalendarIcon, MapPinIcon, UserIcon } from "lucide-react";
import { useAuth } from "@/context/authContext";
import axios from "axios";
import Modal from '@/components/Modal';
import moment from "moment";

interface PendingEvent {
  id: string;
  name: string;
  description: string;
  dateTimestamp: string;
  endTimestamp?: string;
  address: string;
  promoter: {
    id: string;
    name: string;
    email: string;
  };
  establishment: {
    id: string;
    name: string;
  };
  status: "PENDING" | "APPROVE" | "REJECT";
  createdAt: string;
}

export default function AprovacoesPage() {
  const { user, token } = useAuth();
  const [pendingEvents, setPendingEvents] = useState<PendingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [selectedEvent, setSelectedEvent] = useState<PendingEvent | null>(null);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [processingAction, setProcessingAction] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para o modal de confirmação
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'approve' | 'reject' | null>(null);
  const [confirmEventId, setConfirmEventId] = useState<string | null>(null);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmTitle, setConfirmTitle] = useState('');

  const rowsPerPage = 10;

  // Função para limpar mensagens após alguns segundos
  const clearMessages = () => {
    setTimeout(() => {
      setSuccess(null);
      setError(null);
    }, 3000);
  };

  useEffect(() => {
    if (user === null) return;
    if (token === null) return;
    fetchPendingEvents();
  }, [user, token]);

  const fetchPendingEvents = async () => {
    if (token === null) return;
    if (!user?.establishment?.id) return;

    setLoading(true);
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/events/pending-approvals/${user.establishment.id}`, {
        headers: {
          'authorization': `Bearer ${token}`
        }
      });
      setPendingEvents(response.data.events || []);
    } catch (error) {
      console.error('Erro ao buscar eventos pendentes:', error);
      setPendingEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewEvent = (event: PendingEvent) => {
    setSelectedEvent(event);
    onOpen();
  };

  const handleApproveEvent = async (eventId: string) => {
    setProcessingAction(eventId);
    setSuccess(null);
    setError(null);
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/events/${eventId}/approve`, {}, {
        headers: {
          'authorization': `Bearer ${token}`
        }
      });
      await fetchPendingEvents();
      setSuccess('Evento aprovado com sucesso!');
      clearMessages();
    } catch (error) {
      console.error('Erro ao aprovar evento:', error);
      setError('Erro ao aprovar evento');
      clearMessages();
    } finally {
      setProcessingAction(null);
    }
  };

  const handleRejectEvent = async (eventId: string) => {
    setProcessingAction(eventId);
    setSuccess(null);
    setError(null);
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/events/${eventId}/reject`, {}, {
        headers: {
          'authorization': `Bearer ${token}`
        }
      });
      await fetchPendingEvents();
      setSuccess('Evento rejeitado com sucesso!');
      clearMessages();
    } catch (error) {
      console.error('Erro ao rejeitar evento:', error);
      setError('Erro ao rejeitar evento');
      clearMessages();
    } finally {
      setProcessingAction(null);
    }
  };

  // Funções para abrir modais de confirmação
  const openApproveConfirm = (eventId: string) => {
    setConfirmTitle('Confirmar Aprovação');
    setConfirmMessage('Tem certeza que deseja aprovar este evento?');
    setConfirmAction('approve');
    setConfirmEventId(eventId);
    setShowConfirmModal(true);
  };

  const openRejectConfirm = (eventId: string) => {
    setConfirmTitle('Confirmar Rejeição');
    setConfirmMessage('Tem certeza que deseja rejeitar este evento?');
    setConfirmAction('reject');
    setConfirmEventId(eventId);
    setShowConfirmModal(true);
  };

  // Função para executar ação confirmada
  const executeConfirmedAction = async () => {
    if (!confirmEventId || !confirmAction) return;
    
    if (confirmAction === 'approve') {
      await handleApproveEvent(confirmEventId);
    } else if (confirmAction === 'reject') {
      await handleRejectEvent(confirmEventId);
    }
    
    setShowConfirmModal(false);
    setConfirmAction(null);
    setConfirmEventId(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING": return "warning";
      case "APPROVE": return "success";
      case "REJECT": return "danger";
      default: return "default";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "PENDING": return "Pendente";
      case "APPROVE": return "Aprovado";
      case "REJECT": return "Rejeitado";
      default: return "Desconhecido";
    }
  };

  const filteredEvents = pendingEvents.filter(event =>
    event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.promoter?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pages = Math.ceil(filteredEvents.length / rowsPerPage);
  const items = filteredEvents.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  // Verificar se o usuário tem estabelecimento
  if (!user?.establishment?.id) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">Você precisa ter um estabelecimento para ver aprovações de eventos.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Aprovações de Eventos</h1>
        <div className="flex gap-2">
          <Input
            placeholder="Buscar eventos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
            startContent={<SearchIcon className="w-4 h-4 text-gray-400" />}
          />
        </div>
      </div>

      {/* Mensagens de sucesso e erro */}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 text-sm">{success}</p>
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          {/* Tabela responsiva */}
          <div className="w-full overflow-x-auto">
            <Table aria-label="Tabela de eventos pendentes" className="min-w-[800px]">
              <TableHeader>
                <TableColumn>EVENTO</TableColumn>
                <TableColumn>PROMOTER</TableColumn>
                <TableColumn>DATA/HORA</TableColumn>
                <TableColumn>ENDEREÇO</TableColumn>
                <TableColumn>STATUS</TableColumn>
                <TableColumn>AÇÕES</TableColumn>
              </TableHeader>
              <TableBody>
                {items.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <p className="text-bold">{event.name}</p>
                        <p
                          className="text-tiny text-gray-500 truncate max-w-[120px] cursor-pointer"
                          title={event.description}
                          style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                        >
                          {event.description}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <p className="text-bold text-small">{event.promoter?.name || 'N/A'}</p>
                        <p className="text-tiny text-gray-500">{event.promoter?.email || 'N/A'}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <p className="text-bold text-small">
                          {moment(event.dateTimestamp).format('DD/MM/YYYY')}
                        </p>
                        <div className="text-tiny text-gray-500">
                          <p><strong>Início:</strong> {moment(event.dateTimestamp).format('HH:mm')}</p>
                          {event.endTimestamp && (
                            <p><strong>Término:</strong> {moment(event.endTimestamp).format('HH:mm')}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <p
                          className="text-bold text-small truncate max-w-[120px] cursor-pointer"
                          title={event.address}
                          style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                        >
                          {event.address || 'N/A'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Chip
                        className="capitalize"
                        color={getStatusColor(event.status) as any}
                        size="sm"
                        variant="flat"
                      >
                        {getStatusText(event.status)}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="flat"
                          onPress={() => handleViewEvent(event)}
                        >
                          <EyeIcon size={16} />
                          Ver detalhes
                        </Button>
                        {event.status === "PENDING" && (
                          <>
                            <Button
                              size="sm"
                              color="success"
                              variant="flat"
                              onPress={() => openApproveConfirm(event.id)}
                              isLoading={processingAction === event.id}
                            >
                              <CheckIcon size={16} />
                              Aprovar
                            </Button>
                            <Button
                              size="sm"
                              color="danger"
                              variant="flat"
                              onPress={() => openRejectConfirm(event.id)}
                              isLoading={processingAction === event.id}
                            >
                              <XIcon size={16} />
                              Rejeitar
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

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

      {/* Modal de Detalhes do Evento */}
      <Modal open={isOpen} setOpen={onOpenChange}>
        <div className="p-4 sm:p-6 w-full max-w-xs sm:max-w-md mx-auto">
          <h3 className="text-lg font-semibold mb-4 text-center">Detalhes do Evento</h3>
          {selectedEvent && (
            <div className="flex flex-col gap-4">
              <div>
                <span className="block text-xs font-medium text-gray-400">Nome do Evento</span>
                <span className="block text-base font-semibold text-gray-900 break-words">{selectedEvent.name}</span>
              </div>
              <div>
                <span className="block text-xs font-medium text-gray-400">Descrição</span>
                <span className="block text-sm text-gray-800 break-words">{selectedEvent.description}</span>
              </div>
              <div className="flex gap-4">
                <div>
                  <span className="block text-xs font-medium text-gray-400">Data</span>
                  <span className="block text-sm text-gray-800">{moment(selectedEvent.dateTimestamp).format('DD/MM/YYYY')}</span>
                </div>
                <div>
                  <span className="block text-xs font-medium text-gray-400">Hora</span>
                  <span className="block text-sm text-gray-800">{moment(selectedEvent.dateTimestamp).format('HH:mm')}</span>
                </div>
              </div>
              <div>
                <span className="block text-xs font-medium text-gray-400">Endereço</span>
                <span className="block text-sm text-gray-800 break-words">{selectedEvent.address || 'N/A'}</span>
              </div>
              <div>
                <span className="block text-xs font-medium text-gray-400">Estabelecimento</span>
                <span className="block text-sm text-gray-800">{selectedEvent.establishment?.name || 'N/A'}</span>
              </div>
              <div>
                <span className="block text-xs font-medium text-gray-400">Promoter</span>
                <span className="block text-sm text-gray-800">{selectedEvent.promoter?.name || 'N/A'} ({selectedEvent.promoter?.email || 'N/A'})</span>
              </div>
              <div>
                <span className="block text-xs font-medium text-gray-400">Status</span>
                <Chip
                  className="capitalize mt-1"
                  color={getStatusColor(selectedEvent.status) as any}
                  size="sm"
                  variant="flat"
                >
                  {getStatusText(selectedEvent.status)}
                </Chip>
              </div>
              <div>
                <span className="block text-xs font-medium text-gray-400">Data de Solicitação</span>
                <span className="block text-sm text-gray-800">{new Date(selectedEvent.createdAt).toLocaleString('pt-BR')}</span>
              </div>
            </div>
          )}
          <div className="mt-6 flex justify-end">
            <Button
              color="primary"
              variant="flat"
              onPress={onOpenChange}
              className="w-full"
            >
              Fechar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de Confirmação */}
      <Modal open={showConfirmModal} setOpen={setShowConfirmModal}>
        <div className="p-6 bg-white">
          <h3 className="text-lg font-semibold mb-4 text-orange-600">{confirmTitle}</h3>
          <p className="text-sm text-gray-700 mb-6">{confirmMessage}</p>
          
          <div className="flex justify-end gap-3">
            {confirmAction && (
              <Button
                color="default"
                variant="flat"
                onPress={() => setShowConfirmModal(false)}
              >
                Cancelar
              </Button>
            )}
            <Button
              color={confirmAction ? (confirmAction === 'approve' ? 'success' : 'danger') : 'primary'}
              variant="flat"
              onPress={confirmAction ? executeConfirmedAction : () => setShowConfirmModal(false)}
            >
              {confirmAction ? (confirmAction === 'approve' ? 'Aprovar' : 'Rejeitar') : 'OK'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
} 