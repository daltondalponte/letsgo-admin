"use client"
import { useState, useEffect } from "react";
import { Card, CardBody, CardHeader, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Button, Input, Chip, Pagination, useDisclosure, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Spinner } from "@nextui-org/react";
import { SearchIcon, EyeIcon, CalendarIcon, MapPinIcon, ClockIcon } from "lucide-react";
import { useAuth } from "@/context/authContext";
import axios from "axios";
import moment from "moment";

interface PendingEvent {
  id: string;
  name: string;
  description: string;
  dateTimestamp: string;
  endTimestamp?: string;
  address: string;
  establishment: {
    id: string;
    name: string;
  };
  status: "PENDING" | "APPROVE" | "REJECT";
  createdAt: string;
  isActive: boolean;
}

export default function EventosPendentesPage() {
  const { user, token } = useAuth();
  const [pendingEvents, setPendingEvents] = useState<PendingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [selectedEvent, setSelectedEvent] = useState<PendingEvent | null>(null);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

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
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/event/find-many-by-user`, {
        headers: {
          'authorization': `Bearer ${token}`
        }
      });
      
      // Filtrar apenas eventos inativos (pendentes de aprovação)
      const inactiveEvents = response.data.events.filter((event: any) => !event.isActive);
      setPendingEvents(inactiveEvents);
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

  const getStatusColor = (status: string, isActive: boolean) => {
    if (!isActive) return "warning";
    switch (status) {
      case "PENDING": return "warning";
      case "APPROVE": return "success";
      case "REJECT": return "danger";
      default: return "default";
    }
  };

  const getStatusText = (status: string, isActive: boolean) => {
    if (!isActive) return "Pendente de Aprovação";
    switch (status) {
      case "PENDING": return "Pendente";
      case "APPROVE": return "Aprovado";
      case "REJECT": return "Rejeitado";
      default: return "Desconhecido";
    }
  };

  const filteredEvents = pendingEvents.filter(event =>
    event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.establishment?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pages = Math.ceil(filteredEvents.length / rowsPerPage);
  const items = filteredEvents.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  // Verificar se o usuário é um promoter
  if (user?.type !== 'PROFESSIONAL_PROMOTER') {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">Esta página é apenas para promoters.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Meus Eventos Pendentes</h1>
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
          {pendingEvents.length === 0 ? (
            <Card>
              <CardBody>
                <div className="text-center py-8">
                  <ClockIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">Nenhum evento pendente</h3>
                  <p className="text-gray-500">Você não tem eventos aguardando aprovação no momento.</p>
                </div>
              </CardBody>
            </Card>
          ) : (
            <>
              <Table aria-label="Tabela de eventos pendentes">
                <TableHeader>
                  <TableColumn>EVENTO</TableColumn>
                  <TableColumn>ESTABELECIMENTO</TableColumn>
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
                          <p className="text-bold text-small">{event.establishment?.name || 'N/A'}</p>
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
                          <p className="text-bold text-small">{event.address || 'N/A'}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Chip
                          className="capitalize"
                          color={getStatusColor(event.status, event.isActive) as any}
                          size="sm"
                          variant="flat"
                        >
                          {getStatusText(event.status, event.isActive)}
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
                  <strong>Data:</strong> {moment(selectedEvent.dateTimestamp).format('DD/MM/YYYY')}
                </div>
                <div>
                  <strong>Hora:</strong> {moment(selectedEvent.dateTimestamp).format('HH:mm')}
                </div>
                <div>
                  <strong>Endereço:</strong> {selectedEvent.address || 'N/A'}
                </div>
                <div>
                  <strong>Estabelecimento:</strong> {selectedEvent.establishment?.name || 'N/A'}
                </div>
                <div>
                  <strong>Status:</strong> {getStatusText(selectedEvent.status, selectedEvent.isActive)}
                </div>
                <div>
                  <strong>Data de Solicitação:</strong> {new Date(selectedEvent.createdAt).toLocaleString('pt-BR')}
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-blue-800 text-sm">
                    <strong>Informação:</strong> Seu evento está aguardando aprovação do proprietário do estabelecimento. 
                    Você será notificado assim que for aprovado ou rejeitado.
                  </p>
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