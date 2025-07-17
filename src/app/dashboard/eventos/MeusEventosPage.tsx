import React, { useState, useEffect } from 'react';
import { Button, Input, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Image, Chip, Modal, ModalBody, ModalHeader, ModalFooter, ModalContent, Spinner, Card, CardBody } from '@nextui-org/react';
import { PlusCircleIcon, MagnifyingGlassCircleIcon, UsersIcon, TicketIcon, EyeIcon, PencilIcon, TrashIcon, PhotoIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/context/authContext';
import { ConfirmationModal } from '@/components/ConfirmationModal';
import { ModalFormTicket } from '@/components/ModalFormTicket';
import { useRouter } from 'next/navigation';

function IngressosModal({ event, isOpen, onClose, onEventUpdate }: { 
  event: any, 
  isOpen: boolean, 
  onClose: () => void,
  onEventUpdate?: (updatedEvent: any) => void 
}) {
  const { token, user } = useAuth();
  const [isTicketFormOpen, setIsTicketFormOpen] = useState(false);
  const [ticketToEdit, setTicketToEdit] = useState<any>(null);
  const [currentEvent, setCurrentEvent] = useState<any>(event);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'confirm' | 'success' | 'error' | 'info';
    onConfirm: () => void;
    isDestructive?: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'confirm',
    onConfirm: () => {},
    isDestructive: false
  });

  // Função para verificar se o usuário pode editar o evento
  const canEditEvent = (event: any) => {
    if (!event || !user) return false;
    
    // Se o usuário é owner, pode editar eventos criados por ele mesmo ou eventos do seu estabelecimento
    if (user?.type === 'PROFESSIONAL_OWNER') {
      return event.useruid === user.uid || (event.creator && event.creator.id === user.uid);
    }
    // Se o usuário é promoter, só pode editar eventos criados por ele mesmo
    if (user?.type === 'PROFESSIONAL_PROMOTER') {
      return event.useruid === user.uid || (event.creator && event.creator.id === user.uid);
    }
    return true; // Para outros tipos de usuário
  };

  // Atualizar currentEvent quando event mudar
  useEffect(() => {
    setCurrentEvent(event);
  }, [event]);

  const handleAddNewTicket = () => {
    setTicketToEdit(null);
    setIsTicketFormOpen(true);
  };

  const handleEditTicket = (ticket: any) => {
    setTicketToEdit(ticket);
    setIsTicketFormOpen(true);
  };

  const handleDeleteTicket = async (ticketId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Confirmar Exclusão',
      message: 'Tem certeza que deseja excluir este ingresso?',
      type: 'confirm',
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/ticket/${ticketId}`, {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (!response.ok) throw new Error('Erro ao deletar ingresso');
          
          // Atualizar apenas os tickets do evento atual
          await refreshTickets();
        } catch (error: any) {
          setConfirmModal({
            isOpen: true,
            title: 'Erro',
            message: error.message || 'Erro ao deletar ingresso',
            type: 'error',
            onConfirm: () => {},
            isDestructive: false
          });
        }
      },
      isDestructive: true
    });
  };

  const refreshTickets = async () => {
    if (!currentEvent?.id || !token) return;
    
    try {
      // Buscar apenas os dados atualizados do evento
      const response = await fetch(`/api/event/find-by-id/${currentEvent.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) throw new Error('Erro ao atualizar dados do evento');
      
      const data = await response.json();
      const updatedEvent = data.event;
      
      // Preservar dados existentes e apenas atualizar os ingressos
      const mergedEvent = {
        ...currentEvent,
        ...updatedEvent,
        Ticket: updatedEvent.Ticket || updatedEvent.tickets || currentEvent.Ticket || []
      };
      
      setCurrentEvent(mergedEvent);
      
      // Atualizar também o evento na lista principal
      if (onEventUpdate) {
        onEventUpdate(mergedEvent);
      }
    } catch (error: any) {
      console.error('Erro ao atualizar tickets:', error);
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onOpenChange={onClose} size="lg">
        <ModalContent>
          {(onCloseModal) => (
            <>
              <ModalHeader>Ingressos de {currentEvent?.name}</ModalHeader>
              <ModalBody>
                <Button
                  className="mb-4 bg-[#FF6600] text-white font-bold"
                  onPress={handleAddNewTicket}
                  isDisabled={!canEditEvent(currentEvent)}
                  title={!canEditEvent(currentEvent) ? 'Você não pode adicionar ingressos a eventos de outros usuários' : 'Novo Ingresso'}
                >
                  Novo Ingresso
                </Button>
                {currentEvent?.Ticket && currentEvent.Ticket.length > 0 ? (
                  <div className="space-y-2">
                    {currentEvent.Ticket.map((ticket: any) => (
                      <Card key={ticket.id} className="mb-2">
                        <CardBody className="flex flex-row items-center justify-between">
                          <div>
                            <span className="font-medium">{ticket.description}</span> - R$ {ticket.price} ({ticket.quantity_available} unid.)
                          </div>
                          <div>
                            <Button size="sm" color="primary" className="mr-2" onPress={() => handleEditTicket(ticket)} isDisabled={!canEditEvent(currentEvent)} title={!canEditEvent(currentEvent) ? 'Você não pode editar ingressos de eventos de outros usuários' : 'Editar'}>Editar</Button>
                            <Button size="sm" color="danger" onPress={() => handleDeleteTicket(ticket.id)} isDisabled={!canEditEvent(currentEvent)} title={!canEditEvent(currentEvent) ? 'Você não pode remover ingressos de eventos de outros usuários' : 'Remover'}>Remover</Button>
                          </div>
                        </CardBody>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-500">Nenhum ingresso cadastrado para este evento.</div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button color="default" variant="light" onPress={onCloseModal}>Fechar</Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Modal de Formulário de Ticket */}
      <ModalFormTicket
        isOpen={isTicketFormOpen}
        onClose={() => setIsTicketFormOpen(false)}
        eventId={currentEvent?.id || ""}
        ticketToUpdate={ticketToEdit}
        callBack={refreshTickets}
      />

      {/* Modal de Confirmação */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        isDestructive={confirmModal.isDestructive}
      />
    </>
  );
}

function EventosTable() {
  const { token, user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [removingReceptionist, setRemovingReceptionist] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'confirm' | 'success' | 'error' | 'info';
    onConfirm: () => void;
    isDestructive?: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'confirm',
    onConfirm: () => {},
    isDestructive: false
  });

  // Estados para modal de recepcionistas
  const [isReceptionistModalOpen, setIsReceptionistModalOpen] = useState(false);
  const [selectedEventForReceptionist, setSelectedEventForReceptionist] = useState<any>(null);
  const [availableReceptionists, setAvailableReceptionists] = useState<any[]>([]);
  const [loadingReceptionists, setLoadingReceptionists] = useState(false);

  // Estados para modal de detalhes do evento
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedEventForDetails, setSelectedEventForDetails] = useState<any>(null);

  // Função para verificar se o usuário pode editar o evento
  const canEditEvent = (event: any) => {
    if (!event || !user) return false;
    
    // Se o usuário é owner, pode editar eventos criados por ele mesmo ou eventos do seu estabelecimento
    if (user?.type === 'PROFESSIONAL_OWNER') {
      return event.useruid === user.uid || (event.creator && event.creator.id === user.uid);
    }
    // Se o usuário é promoter, só pode editar eventos criados por ele mesmo
    if (user?.type === 'PROFESSIONAL_PROMOTER') {
      return event.useruid === user.uid || (event.creator && event.creator.id === user.uid);
    }
    return true; // Para outros tipos de usuário
  };

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/event/find-many-by-user-approved', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error('Erro ao buscar eventos');
        }
        const data = await response.json();
        setEvents(data.events || []);
      } catch (err: any) {
        setError(err.message || 'Erro ao buscar eventos');
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchEvents();
  }, [token]);

  const handleOpenModal = (event: any) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
  };

  // Função para abrir modal de detalhes do evento
  const handleOpenDetailsModal = (event: any) => {
    setSelectedEventForDetails(event);
    setIsDetailsModalOpen(true);
  };

  // Função para fechar modal de detalhes do evento
  const handleCloseDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedEventForDetails(null);
  };

  // Função para atualizar evento na lista principal
  const handleEventUpdate = (updatedEvent: any) => {
    setEvents(prev => prev.map(event => 
      event.id === updatedEvent.id ? updatedEvent : event
    ));
  };

  const handleRemoveReceptionist = async (eventId: string, managerId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Confirmar Desvinculação',
      message: 'Tem certeza que deseja desvincular este recepcionista do evento?',
      type: 'confirm',
      onConfirm: async () => {
        setRemovingReceptionist(eventId + '-' + managerId);
        try {
          const response = await fetch(`/api/event-manager/delete/${managerId}`, {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (!response.ok) throw new Error('Erro ao desvincular recepcionista');
          // Atualizar lista de eventos (refetch ou filtro local)
          setEvents((prev) => prev.map((e) =>
            e.id === eventId ? { ...e, managers: (e.managers || []).filter((m: any) => m.id !== managerId) } : e
          ));
        } catch (err: any) {
          setConfirmModal({
            isOpen: true,
            title: 'Erro',
            message: err.message || 'Erro ao desvincular recepcionista',
            type: 'error',
            onConfirm: () => {},
            isDestructive: false
          });
        } finally {
          setRemovingReceptionist(null);
        }
      },
      isDestructive: false
    });
  };

  // Função para carregar recepcionistas disponíveis
  const loadAvailableReceptionists = async () => {
    if (!token) return;

    setLoadingReceptionists(true);
    try {
      const response = await fetch('/api/admin/users/ticket-takers', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Erro ao carregar recepcionistas');
      
      const data = await response.json();
      setAvailableReceptionists(data.ticketTakers || []);
    } catch (error: any) {
      console.error('Erro ao carregar recepcionistas:', error);
      setAvailableReceptionists([]);
    } finally {
      setLoadingReceptionists(false);
    }
  };

  // Função para abrir modal de recepcionistas
  const handleOpenReceptionistModal = async (event: any) => {
    setSelectedEventForReceptionist(event);
    setIsReceptionistModalOpen(true);
    await loadAvailableReceptionists();
  };

  // Função para fechar modal de recepcionistas
  const handleCloseReceptionistModal = () => {
    setIsReceptionistModalOpen(false);
    setSelectedEventForReceptionist(null);
    setAvailableReceptionists([]);
  };

  // Função para vincular recepcionista
  const handleLinkReceptionist = async (receptionistId: string) => {
    if (!selectedEventForReceptionist || !token) return;

    try {
      const response = await fetch('/api/event-manager', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          eventId: selectedEventForReceptionist.id,
          userUid: receptionistId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao vincular recepcionista');
      }

      // Fechar modal e atualizar lista de eventos
      handleCloseReceptionistModal();
      
      // Recarregar eventos para mostrar o recepcionista vinculado
      const eventsResponse = await fetch('/api/event/find-many-by-user-approved', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (eventsResponse.ok) {
        const data = await eventsResponse.json();
        setEvents(data.events || []);
      }
    } catch (error: any) {
      setConfirmModal({
        isOpen: true,
        title: 'Erro',
        message: error.message || 'Erro ao vincular recepcionista',
        type: 'error',
        onConfirm: () => {},
        isDestructive: false
      });
    }
  };

  // Função para excluir evento
  const handleDeleteEvent = async (event: any) => {
    setConfirmModal({
      isOpen: true,
      title: 'Confirmar Exclusão',
      message: `Tem certeza que deseja excluir o evento "${event.name}"?`,
      type: 'confirm',
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/event/delete/${event.id}`, {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Erro ao excluir evento');
          }

          // Remover o evento da lista local
          setEvents(prev => prev.filter(e => e.id !== event.id));
          
        } catch (error: any) {
          console.error('Erro ao excluir evento:', error);
          setConfirmModal({
            isOpen: true,
            title: 'Erro',
            message: error.message || 'Erro ao excluir evento',
            type: 'error',
            onConfirm: () => {},
            isDestructive: false
          });
        }
      },
      isDestructive: true
    });
  };

  if (loading) {
    return <div className="flex justify-center items-center py-12"><Spinner size="lg" /></div>;
  }
  if (error) {
    return <div className="text-center text-red-500 py-8">{error}</div>;
  }

  return (
    <div>
      <Table aria-label="Tabela de eventos" removeWrapper className="table-auto text-sm border-separate border-spacing-0">
        <TableHeader>
          <TableColumn>FOTO</TableColumn>
          <TableColumn>EVENTO</TableColumn>
          <TableColumn>LOCAL</TableColumn>
          <TableColumn className="min-w-[140px]">DATA</TableColumn>
          <TableColumn>STATUS</TableColumn>
          <TableColumn>CRIADO POR</TableColumn>
          <TableColumn>INGRESSOS</TableColumn>
          <TableColumn className="min-w-[180px]">RECEPCIONISTAS</TableColumn>
          <TableColumn>DETALHES</TableColumn>
          <TableColumn>AÇÕES</TableColumn>
        </TableHeader>
        <TableBody>
          {events.map((event, index) => (
            <TableRow key={event.id} className={`${index < events.length - 1 ? 'border-b border-default-200 dark:border-default-100' : ''}`}>
              {/* FOTO */}
              <TableCell>
                {event.photos && event.photos.length > 0 ? (
                  <Image src={event.photos[0]} alt={event.name} className="w-12 h-12 rounded-lg object-cover border border-default-200 shadow-sm" />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-default-100 border border-default-200 flex items-center justify-center">
                    <PhotoIcon className="w-6 h-6 text-default-400" />
                  </div>
                )}
              </TableCell>
              {/* EVENTO */}
              <TableCell>
                <div>
                  <p className="font-bold text-theme-primary leading-tight text-lg">{event.name}</p>
                  <p className="text-xs text-theme-secondary line-clamp-1">{event.description}</p>
                </div>
              </TableCell>
              {/* LOCAL */}
              <TableCell>
                <p className="font-medium text-theme-primary leading-tight">{event.establishment?.name || '-'}</p>
              </TableCell>
              {/* DATA */}
              <TableCell>
                <div className="flex flex-col gap-1">
                  <span className="text-theme-primary font-medium text-sm">
                    {new Date(event.dateTimestamp).toLocaleDateString('pt-BR')}
                  </span>
                  <div className="flex flex-col text-xs text-default-500">
                    <span>
                      <strong>Início:</strong> {new Date(event.dateTimestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {event.endTimestamp && (
                      <span>
                        <strong>Término:</strong> {new Date(event.endTimestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                </div>
              </TableCell>
              {/* STATUS */}
              <TableCell>
                <Chip color={event.approvalStatus === 'APPROVED' ? 'success' : event.approvalStatus === 'PENDING' ? 'warning' : 'danger'} variant="flat" size="sm" className="text-xs px-2">
                  {event.approvalStatus === 'APPROVED' ? 'Aprovado' : event.approvalStatus === 'PENDING' ? 'Aguardando' : 'Rejeitado'}
                </Chip>
              </TableCell>
              {/* CRIADO POR */}
              <TableCell>
                <div className="flex items-center gap-1">
                  <UsersIcon className={`w-4 h-4 ${canEditEvent(event) ? 'text-default-400' : 'text-warning-500'}`} />
                  <span className={`font-medium ${canEditEvent(event) ? 'text-theme-primary' : 'text-warning-600'}`}>
                    {event.creator?.name || (event.useruid === user?.uid ? 'Você' : event.user?.name || '-')}
                    {!canEditEvent(event) && ' (Somente visualização)'}
                  </span>
                </div>
              </TableCell>
              {/* INGRESSOS */}
              <TableCell>
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  className="flex items-center justify-center"
                  title={!canEditEvent(event) ? "Você não pode modificar ingressos de eventos de outros usuários" : "Visualizar ingressos"}
                  isDisabled={!canEditEvent(event)}
                  onPress={() => handleOpenModal(event)}
                >
                  <TicketIcon className="w-5 h-5 text-default-400" />
                </Button>
                                        <span className="ml-2 text-theme-primary font-medium">{event.Ticket?.length || 0}</span>
              </TableCell>
              {/* RECEPCIONISTAS */}
              <TableCell>
                <div className="flex flex-col gap-1">
                  {(() => {
                    return event.managers && event.managers.length > 0 ? (
                      event.managers.map((manager: any, idx: number) => {
                        const uid = manager.user?.uid || manager.user?.id || manager.id;
                        return (
                          <span key={idx} className="flex items-center gap-1 text-xs text-theme-primary font-medium">
                            <UsersIcon className="w-3 h-3 text-default-400" />
                            <span title={manager.user?.email || manager.email || ''}>{manager.user?.name || manager.name}</span>
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              color="danger"
                              className="ml-1"
                              title="Desvincular recepcionista"
                              isLoading={removingReceptionist === event.id + '-' + manager.id}
                              isDisabled={!canEditEvent(event)}
                              onPress={() => handleRemoveReceptionist(event.id, manager.id)}
                            >
                              <TrashIcon className="w-3 h-3" />
                            </Button>
                          </span>
                        );
                      })
                    ) : (
                      <span>-</span>
                    );
                  })()}
                  <Button
                    size="sm"
                    variant="flat"
                    className="text-default-500 mt-1 bg-default-200 dark:bg-default-100"
                    title={!canEditEvent(event) ? "Você não pode modificar eventos de outros usuários" : "Vincular Recepcionistas"}
                    isDisabled={!canEditEvent(event)}
                    onPress={() => handleOpenReceptionistModal(event)}
                  >
                    Adicionar
                  </Button>
                </div>
              </TableCell>
              {/* DETALHES */}
              <TableCell>
                <Button isIconOnly size="sm" variant="light" className="text-default-500" title="Ver detalhes do evento" onPress={() => handleOpenDetailsModal(event)}>
                  <EyeIcon className="w-5 h-5" />
                </Button>
              </TableCell>
              {/* AÇÕES */}
              <TableCell>
                <div className="flex items-center gap-1 flex-wrap">
                  <Button 
                    size="sm" 
                    variant="flat" 
                    color="primary" 
                    className="min-w-0 px-2" 
                    title={!canEditEvent(event) ? "Você não pode modificar eventos de outros usuários" : "Editar foto"}
                    isDisabled={!canEditEvent(event)}
                  >
                    <PencilIcon className="w-3 h-3 mr-1" />Foto
                  </Button>
                  <Button 
                    size="sm" 
                    variant="flat" 
                    color="danger" 
                    className="min-w-0 px-2" 
                    title={!canEditEvent(event) ? "Você não pode modificar eventos de outros usuários" : "Excluir evento"}
                    isDisabled={!canEditEvent(event)}
                    onPress={() => handleDeleteEvent(event)}
                  >
                    <TrashIcon className="w-3 h-3 mr-1" />Excluir
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <IngressosModal event={selectedEvent} isOpen={isModalOpen} onClose={handleCloseModal} onEventUpdate={handleEventUpdate} />
      
      {/* Modal de Confirmação */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        isDestructive={confirmModal.isDestructive}
      />

      {/* Modal de Vinculação de Recepcionistas */}
      <Modal isOpen={isReceptionistModalOpen} onOpenChange={setIsReceptionistModalOpen} size="3xl">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Vincular Recepcionistas ao Evento</ModalHeader>
              <ModalBody>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      {selectedEventForReceptionist?.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Selecione os recepcionistas que podem validar ingressos neste evento.
                    </p>
                  </div>
                  
                  {loadingReceptionists ? (
                    <div className="text-center py-8">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      <p className="mt-2 text-gray-600">Carregando recepcionistas...</p>
                    </div>
                  ) : availableReceptionists.length > 0 ? (
                    <div className="mt-4">
                      <h3 className="text-lg font-semibold mb-3">Recepcionistas Disponíveis:</h3>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {(() => {
                          const alreadyLinkedReceptionists = (selectedEventForReceptionist?.managers || []).map((m: any) => m.user?.uid || m.user?.id || m.id);
                          const filteredReceptionists = availableReceptionists.filter((r) => !alreadyLinkedReceptionists.includes(r.uid));
                          return filteredReceptionists.map((receptionist) => (
                            <div key={`receptionist-${receptionist.uid}`} className="flex items-center justify-between p-3 border rounded-lg hover:bg-blue-50 transition-colors">
                              <div>
                                <p className="font-medium text-orange-500 hover:text-orange-600 transition-colors">{receptionist.name}</p>
                                <p className="text-sm text-gray-600">{receptionist.email}</p>
                                <p className="text-xs text-gray-500">
                                  Criado em: {new Date(receptionist.createdAt).toLocaleDateString('pt-BR')}
                                </p>
                              </div>
                              <Button
                                size="sm"
                                color="primary"
                                variant="flat"
                                onPress={() => handleLinkReceptionist(receptionist.uid)}
                              >
                                Vincular
                              </Button>
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>Nenhum recepcionista encontrado no sistema.</p>
                      <p className="text-sm mt-2">Crie recepcionistas na página de Recepcionistas primeiro.</p>
                    </div>
                  )}
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="default" variant="flat" onPress={onClose}>
                  Fechar
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Modal de Detalhes do Evento */}
      <Modal isOpen={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen} size="3xl" classNames={{
        base: "max-h-[90vh] overflow-y-auto",
        wrapper: "p-4"
      }}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Detalhes do Evento</ModalHeader>
              <ModalBody className="max-h-[70vh] overflow-y-auto">
                {selectedEventForDetails && (
                  <div className="space-y-6">
                    {/* Cabeçalho com foto e informações básicas */}
                    <div className="flex gap-6">
                      <div className="flex-shrink-0">
                        {selectedEventForDetails.photos && selectedEventForDetails.photos.length > 0 ? (
                          <Image
                            src={selectedEventForDetails.photos[0]}
                            alt={selectedEventForDetails.name}
                            className="w-48 h-48 object-cover rounded-lg border border-default-200"
                          />
                        ) : (
                          <div className="w-48 h-48 rounded-lg bg-default-100 border border-default-200 flex items-center justify-center">
                            <PhotoIcon className="w-16 h-16 text-default-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h2 className="text-2xl font-bold text-theme-primary mb-2">
                          {selectedEventForDetails.name}
                        </h2>
                        <p className="text-theme-secondary mb-4">
                          {selectedEventForDetails.description}
                        </p>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-theme-tertiary">Data e Hora</label>
                            <p className="text-theme-primary">
                              {new Date(selectedEventForDetails.dateTimestamp).toLocaleDateString('pt-BR')} às {new Date(selectedEventForDetails.dateTimestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          {selectedEventForDetails.endTimestamp && (
                            <div>
                              <label className="text-sm font-medium text-theme-tertiary">Término</label>
                              <p className="text-theme-primary">
                                {new Date(selectedEventForDetails.endTimestamp).toLocaleDateString('pt-BR')} às {new Date(selectedEventForDetails.endTimestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          )}
                          <div>
                            <label className="text-sm font-medium text-theme-tertiary">Status</label>
                            <Chip color={selectedEventForDetails.approvalStatus === 'APPROVED' ? 'success' : selectedEventForDetails.approvalStatus === 'PENDING' ? 'warning' : 'danger'} variant="flat" size="sm">
                              {selectedEventForDetails.approvalStatus === 'APPROVED' ? 'Aprovado' : selectedEventForDetails.approvalStatus === 'PENDING' ? 'Aguardando' : 'Rejeitado'}
                            </Chip>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-theme-tertiary">Local</label>
                            <p className="text-theme-primary">
                              {selectedEventForDetails.establishment?.name || selectedEventForDetails.address || 'Não informado'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Informações detalhadas */}
                    <div className="border-t border-default-200 pt-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Ingressos */}
                        <div>
                          <h3 className="text-lg font-semibold mb-3">Ingressos</h3>
                                          {selectedEventForDetails.Ticket && selectedEventForDetails.Ticket.length > 0 ? (
                  <div className="space-y-2">
                    {selectedEventForDetails.Ticket.map((ticket: any) => (
                                <Card key={ticket.id} className="p-3">
                                  <div className="flex justify-between items-center">
                                    <div>
                                      <p className="font-medium">{ticket.description}</p>
                                      <p className="text-sm text-gray-600">
                                        R$ {ticket.price} - {ticket.quantity_available} disponíveis
                                      </p>
                                    </div>
                                  </div>
                                </Card>
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-500">Nenhum ingresso cadastrado</p>
                          )}
                        </div>

                        {/* Recepcionistas */}
                        <div>
                          <h3 className="text-lg font-semibold mb-3">Recepcionistas</h3>
                          {selectedEventForDetails.managers && selectedEventForDetails.managers.length > 0 ? (
                            <div className="space-y-2">
                              {selectedEventForDetails.managers.map((manager: any) => (
                                <Card key={manager.id} className="p-3">
                                  <div className="flex justify-between items-center">
                                    <div>
                                      <p className="font-medium">{manager.user?.name || 'Nome não informado'}</p>
                                      <p className="text-sm text-gray-600">{manager.user?.email || 'Email não informado'}</p>
                                    </div>
                                  </div>
                                </Card>
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-500">Nenhum recepcionista vinculado</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Informações do criador */}
                    {selectedEventForDetails.creator && (
                      <div className="border-t border-default-200 pt-6">
                        <h3 className="text-lg font-semibold mb-3">Criado por</h3>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                            <span className="text-white font-medium">
                              {selectedEventForDetails.creator.name?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{selectedEventForDetails.creator.name}</p>
                            <p className="text-sm text-gray-600">{selectedEventForDetails.creator.email}</p>
                            <p className="text-xs text-gray-500 capitalize">{selectedEventForDetails.creator.type?.toLowerCase().replace('_', ' ')}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button color="default" variant="light" onPress={onClose}>
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

export default function MeusEventosPage() {
  const router = useRouter();

  return (
    <main className="w-full max-w-6xl mx-auto px-6 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Meus Eventos</h1>
        <Button
          color="primary"
          className="bg-[#FF6600] text-white font-bold shadow-none"
          endContent={<PlusCircleIcon className="w-5 h-5" />}
          onPress={() => router.push('/dashboard/eventos/novo')}
        >
          Novo Evento
        </Button>
      </div>
      <div className="mb-4">
        <Input
          placeholder="Buscar eventos..."
          startContent={<MagnifyingGlassCircleIcon className="w-5 h-5 text-default-400" />}
          className="max-w-xs input-theme"
          size="sm"
          variant="bordered"
        />
      </div>
      <EventosTable />
    </main>
  );
} 