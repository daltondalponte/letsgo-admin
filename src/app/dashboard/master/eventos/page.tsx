"use client"
import { useState, useEffect } from "react";
import { Card, CardBody, CardHeader, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Button, Input, Chip, Pagination, useDisclosure, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Image, Spinner } from "@nextui-org/react";
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
    uid: string;
    name: string;
    email: string;
    type: string;
  };
  createdAt: string;
  isActive: boolean;
  tickets?: Array<{
    id: string;
    description: string;
    price: number;
    quantity_available: number;
    sold_count: number;
    revenue: number;
    sales: Array<{
      id: string;
      payment: {
        status: string;
      };
    }>;
  }>;
  stats?: {
    totalTicketsSold: number;
    totalRevenue: number;
    totalAvailable: number;
    ticketTypesCount: number;
  };
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
  }, [token]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/admin/events/all`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setEvents(response.data.events || []);
    } catch (error) {
      console.error("Erro ao buscar eventos:", error);
      setEvents([]);
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

  const getTicketTypesCount = (event: Event) => {
    if (!event.tickets) return 0;
    return event.tickets.length;
  };

  const getTotalSales = (event: Event) => {
    if (event.stats) return event.stats.totalTicketsSold;
    if (!event.tickets) return 0;
    return event.tickets.reduce((total, ticket) => {
      return total + ticket.sold_count;
    }, 0);
  };

  const getTotalRevenue = (event: Event) => {
    if (event.stats) return event.stats.totalRevenue;
    if (!event.tickets) return 0;
    return event.tickets.reduce((total, ticket) => {
      return total + ticket.revenue;
    }, 0);
  };

  const getTotalAvailable = (event: Event) => {
    if (event.stats) return event.stats.totalAvailable;
    if (!event.tickets) return 0;
    return event.tickets.reduce((total, ticket) => {
      return total + ticket.quantity_available;
    }, 0);
  };

  const getTicketTypesDisplay = (event: Event) => {
    if (!event.tickets || event.tickets.length === 0) return "Nenhum";
    
    const types = event.tickets.map(ticket => ticket.description);
    if (types.length <= 2) {
      return types.join(", ");
    }
    return `${types[0]}, ${types[1]} +${types.length - 2}`;
  };

  const formatDate = (dateString: string) => {
    return moment(dateString).format('DD/MM/YYYY HH:mm');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const truncateDescription = (description: string, maxLength: number = 100) => {
    if (!description) return '';
    if (description.length <= maxLength) return description;
    return description.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" color="warning" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex justify-between">
          <h1 className="text-2xl font-bold">Eventos do Sistema</h1>
          <div className="flex gap-2">
            <Input
              placeholder="Buscar eventos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              startContent={<SearchIcon className="w-4 h-4" />}
              className="w-64"
            />
          </div>
        </CardHeader>
        <CardBody>
          <Table aria-label="Tabela de eventos">
            <TableHeader>
              <TableColumn>EVENTO</TableColumn>
              <TableColumn>ESTABELECIMENTO</TableColumn>
              <TableColumn>CRIADO POR</TableColumn>
              <TableColumn>DATA</TableColumn>
              <TableColumn>TIPOS DE INGRESSOS</TableColumn>
              <TableColumn>RECEITA</TableColumn>
              <TableColumn>STATUS</TableColumn>
              <TableColumn>AÇÕES</TableColumn>
            </TableHeader>
            <TableBody emptyContent="Nenhum evento encontrado">
              {items.map((event, index) => (
                <TableRow key={`${event.id}-${index}`}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {event.photos && event.photos.length > 0 && (
                        <Image
                          src={`${process.env.NEXT_PUBLIC_API_URL}/api/image-proxy?file=${encodeURIComponent(event.photos[0])}`}
                          alt={event.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                      )}
                      <div>
                        <p className="font-semibold">{event.name}</p>
                        <p className="text-sm text-gray-500">{truncateDescription(event.description)}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <MapPinIcon className="w-4 h-4" />
                      <span>{event.establishment?.name || 'N/A'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <UsersIcon className="w-4 h-4" />
                      <span>{event.user?.name || 'N/A'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4" />
                      <span>{formatDate(event.dateTimestamp)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <TicketIcon className="w-4 h-4" />
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">{getTicketTypesCount(event)} tipos</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {event.tickets && event.tickets.slice(0, 3).map((ticket, index) => {
                            const colors = [
                              'bg-blue-100 text-blue-800',
                              'bg-green-100 text-green-800', 
                              'bg-purple-100 text-purple-800',
                              'bg-orange-100 text-orange-800',
                              'bg-pink-100 text-pink-800'
                            ];
                            const colorClass = colors[index % colors.length];
                            
                            return (
                              <div key={ticket.id} className={`flex items-center gap-1 ${colorClass} px-2 py-1 rounded-full text-xs font-medium`}>
                                <TicketIcon className="w-3 h-3" />
                                <span>{ticket.description}</span>
                              </div>
                            );
                          })}
                          {event.tickets && event.tickets.length > 3 && (
                            <div className="flex items-center gap-1 bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-medium">
                              <span>+{event.tickets.length - 3}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(getTotalRevenue(event))}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Chip
                      color={event.isActive ? "success" : "warning"}
                      variant="flat"
                    >
                      {event.isActive ? "Ativo" : "Inativo"}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="flat"
                      onPress={() => handleViewEvent(event)}
                    >
                      <EyeIcon className="w-4 h-4" />
                      Ver
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
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

      {/* Modal de detalhes do evento */}
      <Modal 
        isOpen={isOpen} 
        onOpenChange={onOpenChange} 
        size="3xl"
        classNames={{
          base: "my-5 mx-2 max-h-[90vh] overflow-y-auto",
          wrapper: "items-start pt-5 pb-5",
          body: "p-6"
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="text-2xl font-bold text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Detalhes do Evento
              </ModalHeader>
              <ModalBody>
                {selectedEvent && (
                  <div className="space-y-6">
                    {/* Nome do evento */}
                    <div>
                      <h3 className="font-semibold text-xl mb-2">Nome</h3>
                      <p className="text-lg">{selectedEvent.name}</p>
                    </div>

                    {/* Descrição e Foto lado a lado */}
                    <div className="flex flex-col lg:flex-row gap-6">
                      <div className="flex-1">
                        <h3 className="font-semibold mb-2">Descrição</h3>
                        <p className="whitespace-pre-wrap text-gray-700">{selectedEvent.description}</p>
                      </div>
                      {selectedEvent.photos && selectedEvent.photos.length > 0 && (
                        <div className="lg:w-1/3 flex-shrink-0">
                          <h3 className="font-semibold mb-2">Foto do Evento</h3>
                          <Image
                            src={`${process.env.NEXT_PUBLIC_API_URL}/api/image-proxy?file=${encodeURIComponent(selectedEvent.photos[0])}`}
                            alt={selectedEvent.name}
                            className="w-full h-auto max-h-64 object-cover rounded-lg shadow-md"
                          />
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="font-semibold">Data de Início</h3>
                        <p>{formatDate(selectedEvent.dateTimestamp)}</p>
                      </div>
                      <div>
                        <h3 className="font-semibold">Data de Término</h3>
                        <p>{selectedEvent.endTimestamp ? formatDate(selectedEvent.endTimestamp) : 'Não definida'}</p>
                      </div>
                      <div>
                        <h3 className="font-semibold">Estabelecimento</h3>
                        <p>{selectedEvent.establishment?.name}</p>
                        {selectedEvent.establishment?.address && (
                          <p className="text-sm text-gray-600">{selectedEvent.establishment.address}</p>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold">Criado por</h3>
                        <p>{selectedEvent.user?.name}</p>
                        <p className="text-sm text-gray-600">{selectedEvent.user?.email}</p>
                        <Chip 
                          size="sm" 
                          color={selectedEvent.user?.type === 'PROFESSIONAL_OWNER' ? "primary" : "secondary"}
                          variant="flat"
                        >
                          {selectedEvent.user?.type === 'PROFESSIONAL_OWNER' ? 'Proprietário' : 
                           selectedEvent.user?.type === 'PROFESSIONAL_PROMOTER' ? 'Promoter' : 
                           selectedEvent.user?.type}
                        </Chip>
                      </div>
                      <div>
                        <h3 className="font-semibold">Status</h3>
                        <Chip
                          color={selectedEvent.isActive ? "success" : "warning"}
                          variant="flat"
                        >
                          {selectedEvent.isActive ? "Ativo" : "Inativo"}
                        </Chip>
                      </div>
                      <div>
                        <h3 className="font-semibold">Data de Criação</h3>
                        <p>{formatDate(selectedEvent.createdAt)}</p>
                      </div>
                    </div>
                    
                    {selectedEvent.tickets && selectedEvent.tickets.length > 0 ? (
                      <div>
                        <h3 className="font-semibold mb-2">Resumo de Vendas</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-blue-600">{getTotalSales(selectedEvent)}</p>
                            <p className="text-sm text-gray-600">Total Vendido</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-green-600">{formatCurrency(getTotalRevenue(selectedEvent))}</p>
                            <p className="text-sm text-gray-600">Receita Total</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-orange-600">{getTotalAvailable(selectedEvent)}</p>
                            <p className="text-sm text-gray-600">Disponível</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-purple-600">{getTicketTypesCount(selectedEvent)}</p>
                            <p className="text-sm text-gray-600">Tipos de Ingresso</p>
                          </div>
                        </div>

                        <h3 className="font-semibold mb-2">Tipos de Ingressos</h3>
                        <Table aria-label="Tabela de ingressos" className="mb-4">
                          <TableHeader>
                            <TableColumn>Descrição</TableColumn>
                            <TableColumn>Preço</TableColumn>
                            <TableColumn>Disponível</TableColumn>
                            <TableColumn>Vendido</TableColumn>
                            <TableColumn>Receita</TableColumn>
                            <TableColumn>Taxa de Conversão</TableColumn>
                          </TableHeader>
                          <TableBody>
                            {selectedEvent.tickets.map((ticket) => {
                              const soldCount = ticket.sold_count;
                              const revenue = ticket.revenue;
                              const totalQuantity = soldCount + ticket.quantity_available;
                              const conversionRate = totalQuantity > 0 
                                ? ((soldCount / totalQuantity) * 100).toFixed(1)
                                : "0%";
                              
                              return (
                                <TableRow key={ticket.id}>
                                  <TableCell className="font-medium">{ticket.description}</TableCell>
                                  <TableCell>{formatCurrency(ticket.price)}</TableCell>
                                  <TableCell>{ticket.quantity_available}</TableCell>
                                  <TableCell>
                                    <span className="font-semibold text-blue-600">{soldCount}</span>
                                  </TableCell>
                                  <TableCell>
                                    <span className="font-semibold text-green-600">{formatCurrency(revenue)}</span>
                                  </TableCell>
                                  <TableCell>
                                    <Chip 
                                      size="sm" 
                                      color={parseFloat(conversionRate) > 80 ? "success" : parseFloat(conversionRate) > 50 ? "warning" : "danger"}
                                      variant="flat"
                                    >
                                      {conversionRate}%
                                    </Chip>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <TicketIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                        <h3 className="text-lg font-semibold text-gray-600 mb-2">Nenhum Ingresso Criado</h3>
                        <p className="text-gray-500">Este evento ainda não possui tipos de ingressos cadastrados.</p>
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
    </div>
  );
} 