"use client"
import { useState, useEffect } from "react";
import { Card, CardBody, CardHeader, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Button, Input, Chip, Pagination, useDisclosure, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Spinner } from "@nextui-org/react";
import { SearchIcon, CheckIcon, XIcon, EyeIcon, CalendarIcon, MapPinIcon, UserIcon } from "lucide-react";
import { useAuth } from "@/context/authContext";
import axios from "axios";

interface PendingEvent {
  id: string;
  name: string;
  description: string;
  date: string;
  time: string;
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
  status: "PENDING" | "APPROVED" | "REJECTED";
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

  const rowsPerPage = 10;

  useEffect(() => {
    if (user === null) return;
    if (token === null) return;
    fetchPendingEvents();
  }, [user, token]);

  const fetchPendingEvents = async () => {
    if (token === null) return;

    setLoading(true);
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/admin/events/pending-approval`, {
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
    if (token === null) return;

    setProcessingAction(eventId);
    try {
      await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/admin/events/${eventId}/approve`, {}, {
        headers: {
          'authorization': `Bearer ${token}`
        }
      });
      
      // Atualizar localmente
      setPendingEvents(prev => prev.map(event => 
        event.id === eventId 
          ? { ...event, status: "APPROVED" as const }
          : event
      ));
      
      alert('Evento aprovado com sucesso!');
    } catch (error) {
      console.error('Erro ao aprovar evento:', error);
      alert('Erro ao aprovar evento. Tente novamente.');
    } finally {
      setProcessingAction(null);
    }
  };

  const handleRejectEvent = async (eventId: string) => {
    if (token === null) return;

    setProcessingAction(eventId);
    try {
      await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/admin/events/${eventId}/reject`, {}, {
        headers: {
          'authorization': `Bearer ${token}`
        }
      });
      
      // Atualizar localmente
      setPendingEvents(prev => prev.map(event => 
        event.id === eventId 
          ? { ...event, status: "REJECTED" as const }
          : event
      ));
      
      alert('Evento rejeitado com sucesso!');
    } catch (error) {
      console.error('Erro ao rejeitar evento:', error);
      alert('Erro ao rejeitar evento. Tente novamente.');
    } finally {
      setProcessingAction(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING": return "warning";
      case "APPROVED": return "success";
      case "REJECTED": return "danger";
      default: return "default";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "PENDING": return "Pendente";
      case "APPROVED": return "Aprovado";
      case "REJECTED": return "Rejeitado";
      default: return "Desconhecido";
    }
  };

  const filteredEvents = pendingEvents.filter(event =>
    event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.promoter.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pages = Math.ceil(filteredEvents.length / rowsPerPage);
  const items = filteredEvents.slice((page - 1) * rowsPerPage, page * rowsPerPage);

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

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          <Table aria-label="Tabela de eventos pendentes">
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
                      <p className="text-tiny text-gray-500">{event.description}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <p className="text-bold text-small">{event.promoter.name}</p>
                      <p className="text-tiny text-gray-500">{event.promoter.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <p className="text-bold text-small">
                        {new Date(event.date).toLocaleDateString('pt-BR')}
                      </p>
                      <p className="text-tiny text-gray-500">{event.time}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <p className="text-bold text-small">{event.address}</p>
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
                        Ver
                      </Button>
                      
                      {event.status === "PENDING" && (
                        <>
                          <Button
                            size="sm"
                            color="success"
                            variant="flat"
                            onPress={() => handleApproveEvent(event.id)}
                            isLoading={processingAction === event.id}
                          >
                            <CheckIcon size={16} />
                            Aprovar
                          </Button>
                          <Button
                            size="sm"
                            color="danger"
                            variant="flat"
                            onPress={() => handleRejectEvent(event.id)}
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
          <ModalHeader>Detalhes do Evento</ModalHeader>
          <ModalBody>
            {selectedEvent && (
              <div className="space-y-4">
                <div>
                  <strong>Nome do Evento:</strong> {selectedEvent.name}
                </div>
                <div>
                  <strong>Descrição:</strong> {selectedEvent.description}
                </div>
                <div>
                  <strong>Data:</strong> {new Date(selectedEvent.date).toLocaleDateString('pt-BR')}
                </div>
                <div>
                  <strong>Hora:</strong> {selectedEvent.time}
                </div>
                <div>
                  <strong>Endereço:</strong> {selectedEvent.address}
                </div>
                <div>
                  <strong>Estabelecimento:</strong> {selectedEvent.establishment.name}
                </div>
                <div>
                  <strong>Promoter:</strong> {selectedEvent.promoter.name} ({selectedEvent.promoter.email})
                </div>
                <div>
                  <strong>Status:</strong> {getStatusText(selectedEvent.status)}
                </div>
                <div>
                  <strong>Data de Solicitação:</strong> {new Date(selectedEvent.createdAt).toLocaleString('pt-BR')}
                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="flat" onPress={onOpenChange}>
              Fechar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
} 