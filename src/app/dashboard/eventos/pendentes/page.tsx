"use client"
import { useState, useEffect } from "react";
import { Card, CardBody, CardHeader, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Button, Input, Chip, Pagination, useDisclosure, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Spinner, Image } from "@nextui-org/react";
import { SearchIcon, EyeIcon, CalendarIcon, MapPinIcon, ClockIcon, ImageIcon } from "lucide-react";
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
  photos?: string[];
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
              {/* Tabela responsiva */}
              <div className="w-full overflow-x-auto">
                <Table aria-label="Tabela de eventos pendentes" className="min-w-[800px]">
                  <TableHeader>
                    <TableColumn>FOTO</TableColumn>
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
                          {event.photos && event.photos.length > 0 ? (
                            <Image
                              src={event.photos[0]}
                              alt={event.name || "Sem nome"}
                              className="w-12 h-12 rounded-lg object-cover border border-default-200 shadow-sm"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-default-100 border border-default-200 flex items-center justify-center">
                              <ImageIcon className="w-6 h-6 text-default-400" />
                            </div>
                          )}
                        </TableCell>
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
                              Ver detalhes
                            </Button>
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
        </>
      )}

      {/* Modal de Visualização */}
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="md">
        <ModalContent>
          <ModalHeader className="text-center">Detalhes do Evento</ModalHeader>
          <ModalBody>
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
                  <span className="block text-xs font-medium text-gray-400">Status</span>
                  <Chip
                    className="capitalize mt-1"
                    color={getStatusColor(selectedEvent.status, selectedEvent.isActive) as any}
                    size="sm"
                    variant="flat"
                  >
                    {getStatusText(selectedEvent.status, selectedEvent.isActive)}
                  </Chip>
                </div>
                <div>
                  <span className="block text-xs font-medium text-gray-400">Data de Solicitação</span>
                  <span className="block text-sm text-gray-800">{new Date(selectedEvent.createdAt).toLocaleString('pt-BR')}</span>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-blue-800 text-sm">
                    <strong>Informação:</strong> Seu evento está aguardando aprovação do proprietário do estabelecimento. <br/>
                    Você será notificado assim que for aprovado ou rejeitado.
                  </p>
                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button color="primary" variant="flat" onPress={onOpenChange} className="w-full">
              Fechar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
} 