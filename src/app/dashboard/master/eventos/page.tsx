"use client"
import { useState, useEffect } from "react";
import { Card, CardBody, CardHeader, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Button, Input, Chip, Pagination, useDisclosure, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Image } from "@nextui-org/react";
import { SearchIcon, EyeIcon, CalendarIcon, MapPinIcon, UsersIcon, TicketIcon } from "lucide-react";
import { useAuth } from "@/context/authContext";
import axios from "axios";
import moment from "moment";
import "moment/locale/pt-br";

interface Event {
  id: string;
  name: string;
  description: string;
  dateTimestamp: string;
  endTimestamp?: string;
  photos: string[];
  establishment: {
    id: string;
    name: string;
    address: string;
  };
  user: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  isActive: boolean;
  tickets?: Array<{
    id: string;
    description: string;
    price: number;
    quantity_available: number;
    sales: Array<{
      id: string;
      payment: {
        status: string;
      };
    }>;
  }>;
}

export default function EventosMasterPage() {
  const { user, token } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  const rowsPerPage = 10;

  useEffect(() => {
    if (!token) return;
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/admin/events/all`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setEvents(response.data.events || []);
    } catch (error) {
      setEvents([]);
      // Exibir mensagem de erro se necessário
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events
    .filter(event => event && event.name && event.establishment && event.user)
    .filter(event =>
      event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.establishment?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const pages = Math.ceil(filteredEvents.length / rowsPerPage);
  const items = filteredEvents.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const handleViewEvent = (event: Event) => {
    setSelectedEvent(event);
    onOpen();
  };

  const getTotalSales = (event: Event) => {
    if (!event.tickets) return 0;
    return event.tickets.reduce((total, ticket) => {
      const completedSales = ticket.sales.filter(sale => sale.payment.status === "COMPLETED");
      return total + completedSales.length;
    }, 0);
  };

  const getTotalRevenue = (event: Event) => {
    if (!event.tickets) return 0;
    return event.tickets.reduce((total, ticket) => {
      const completedSales = ticket.sales.filter(sale => sale.payment.status === "COMPLETED");
      return total + (completedSales.length * ticket.price);
    }, 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Todos os Eventos</h1>
      </div>

      <Card className="card-theme">
        <CardHeader>
          <Input
            placeholder="Buscar eventos..."
            startContent={<SearchIcon size={20} />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm input-theme"
          />
        </CardHeader>
        <CardBody className="table-container">
          <Table aria-label="Tabela de eventos" className="table-theme">
            <TableHeader>
              <TableColumn>EVENTO</TableColumn>
              <TableColumn>ESTABELECIMENTO</TableColumn>
              <TableColumn>DATA</TableColumn>
              <TableColumn>CRIADOR</TableColumn>
              <TableColumn>VENDAS</TableColumn>
              <TableColumn>RECEITA</TableColumn>
              <TableColumn>STATUS</TableColumn>
              <TableColumn>AÇÕES</TableColumn>
            </TableHeader>
            <TableBody
              emptyContent={loading ? "Carregando..." : "Nenhum evento encontrado"}
              items={items}
            >
              {(event) => (
                <TableRow key={event.createdAt}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {event.photos && event.photos.length > 0 && (
                        <Image
                          src={event.photos[0]}
                          alt={event.name || "Sem nome"}
                          className="w-12 h-12 rounded object-cover"
                        />
                      )}
                      <div>
                        <p className="font-medium text-theme-primary">{event.name || "Sem nome"}</p>
                        <p className="text-sm text-theme-secondary line-clamp-2">{event.description || ""}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-theme-primary">{event.establishment?.name || "Sem estabelecimento"}</p>
                      <div className="flex items-center gap-1 text-sm text-theme-secondary">
                        <MapPinIcon size={14} />
                        <span>{event.establishment?.address || ""}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <CalendarIcon size={16} />
                        <span className="text-theme-primary text-sm">
                          {event.dateTimestamp ? moment(event.dateTimestamp).format('DD/MM/YYYY') : ""}
                        </span>
                      </div>
                      <div className="text-xs text-theme-secondary">
                        <span><strong>Início:</strong> {event.dateTimestamp ? moment(event.dateTimestamp).format('HH:mm') : ""}</span>
                        {event.endTimestamp && (
                          <span className="block"><strong>Término:</strong> {moment(event.endTimestamp).format('HH:mm')}</span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-theme-primary">{event.user?.name || "Sem criador"}</p>
                      <p className="text-sm text-theme-secondary">{event.user?.email || ""}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <TicketIcon size={16} />
                      <span className="text-theme-primary">{getTotalSales(event)} vendas</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium text-green-600">
                      R$ {getTotalRevenue(event).toLocaleString('pt-BR')}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Chip color={event.isActive ? "success" : "danger"} variant="flat">
                      {event.isActive ? "Ativo" : "Inativo"}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      onPress={() => handleViewEvent(event)}
                    >
                      <EyeIcon size={16} />
                    </Button>
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

      {/* Modal de Detalhes do Evento */}
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="4xl">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Detalhes do Evento</ModalHeader>
              <ModalBody>
                {selectedEvent && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="text-sm font-medium text-theme-tertiary">Nome do Evento</label>
                        <p className="text-xl font-bold text-theme-primary">{selectedEvent.name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-theme-tertiary">Status</label>
                        <Chip color={selectedEvent.isActive ? "success" : "danger"} variant="flat" size="lg">
                          {selectedEvent.isActive ? "Ativo" : "Inativo"}
                        </Chip>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-theme-tertiary">Descrição</label>
                      <p className="text-lg text-theme-primary">{selectedEvent.description}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="text-sm font-medium text-theme-tertiary">Data e Hora</label>
                        <div className="flex flex-col gap-1 mt-1">
                          <div className="flex items-center gap-2">
                            <CalendarIcon size={16} />
                            <p className="text-lg text-theme-primary">{moment(selectedEvent.dateTimestamp).format('DD/MM/YYYY')}</p>
                          </div>
                          <div className="text-sm text-theme-secondary">
                            <p><strong>Início:</strong> {moment(selectedEvent.dateTimestamp).format('HH:mm')}</p>
                            {selectedEvent.endTimestamp && (
                              <p><strong>Término:</strong> {moment(selectedEvent.endTimestamp).format('HH:mm')}</p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-theme-tertiary">Total de Vendas</label>
                        <div className="flex items-center gap-2 mt-1">
                          <TicketIcon size={16} />
                          <p className="text-lg font-bold text-theme-primary">{getTotalSales(selectedEvent)}</p>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-theme-tertiary">Receita Total</label>
                        <p className="text-lg font-bold text-green-600">
                          R$ {getTotalRevenue(selectedEvent).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-theme-tertiary">Estabelecimento</label>
                      <div className="mt-1">
                        <p className="font-medium text-theme-primary">{selectedEvent.establishment?.name || "Sem estabelecimento"}</p>
                        <div className="flex items-center gap-2 text-theme-secondary">
                          <MapPinIcon size={16} />
                          <span>{selectedEvent.establishment?.address || ""}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-theme-tertiary">Criador do Evento</label>
                      <div className="mt-1">
                        <p className="font-medium text-theme-primary">{selectedEvent.user?.name || "Sem criador"}</p>
                        <p className="text-theme-secondary">{selectedEvent.user?.email || ""}</p>
                      </div>
                    </div>

                    {selectedEvent.photos && selectedEvent.photos.length > 0 && (
                      <div>
                        <label className="text-sm font-medium text-theme-tertiary">Fotos do Evento</label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                          {selectedEvent.photos.map((photo, index) => (
                            <Image
                              key={index}
                              src={photo}
                              alt={`Foto ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg"
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedEvent.tickets && selectedEvent.tickets.length > 0 && (
                      <div>
                        <label className="text-sm font-medium text-theme-tertiary">Ingressos</label>
                        <div className="space-y-2 mt-2">
                          {selectedEvent.tickets.map((ticket, index) => (
                            <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                              <div>
                                <p className="font-medium text-theme-primary">{ticket.description}</p>
                                <p className="text-sm text-theme-secondary">
                                  {ticket.quantity_available} disponíveis
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-green-600">
                                  R$ {ticket.price.toLocaleString('pt-BR')}
                                </p>
                                <p className="text-sm text-theme-secondary">
                                  {ticket.sales.filter(s => s.payment.status === "COMPLETED").length} vendidos
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="text-sm font-medium text-theme-tertiary">Criado em</label>
                        <p className="text-lg text-theme-primary">{moment(selectedEvent.createdAt).format('DD/MM/YYYY HH:mm')}</p>
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