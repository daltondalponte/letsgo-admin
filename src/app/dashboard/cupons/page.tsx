"use client"
import { useState, useEffect } from "react";
import { Card, CardBody, CardHeader, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Button, Input, Chip, Pagination, useDisclosure, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Select, SelectItem } from "@nextui-org/react";
import { SearchIcon, PlusIcon, EditIcon, TrashIcon, EyeIcon, TicketIcon } from "lucide-react";
import { useAuth } from "@/context/authContext";
import axios from "axios";
import moment from "moment";
import "moment/locale/pt-br";

interface Cupom {
  id: string;
  code: string;
  description: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  minValue: number;
  maxUses: number;
  currentUses: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  eventId?: string;
  eventName?: string;
}

export default function CuponsPage() {
  const { token } = useAuth();
  const [cupons, setCupons] = useState<Cupom[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [selectedCupom, setSelectedCupom] = useState<Cupom | null>(null);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  const rowsPerPage = 10;

  useEffect(() => {
    fetchCupons();
    fetchEvents();
  }, []);

  const fetchCupons = async () => {
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
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/event/find-many-by-user`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setEvents(response.data.events || []);
    } catch (error) {
      console.error('Erro ao buscar eventos:', error);
    }
  };

  const filteredCupons = cupons.filter(cupom =>
    cupom.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cupom.description.toLowerCase().includes(searchTerm.toLowerCase())
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

  const formatDiscount = (cupom: Cupom) => {
    if (cupom.discountType === "PERCENTAGE") {
      return `${cupom.discountValue}%`;
    } else {
      return `R$ ${cupom.discountValue.toLocaleString('pt-BR')}`;
    }
  };

  const isExpired = (validUntil: string) => {
    return moment(validUntil).isBefore(moment());
  };

  const isActive = (cupom: Cupom) => {
    return cupom.isActive && 
           !isExpired(cupom.validUntil) && 
           moment(cupom.validFrom).isBefore(moment()) &&
           cupom.currentUses < cupom.maxUses;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Gestão de Cupons</h1>
        <Button color="primary" startContent={<PlusIcon size={20} />}>
          Novo Cupom
        </Button>
      </div>

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
              <TableColumn>DESCRIÇÃO</TableColumn>
              <TableColumn>DESCONTO</TableColumn>
              <TableColumn>EVENTO</TableColumn>
              <TableColumn>USOS</TableColumn>
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
                  <TableCell>{cupom.description}</TableCell>
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
                      {cupom.currentUses} / {cupom.maxUses}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p>Até {moment(cupom.validUntil).format('DD/MM/YYYY')}</p>
                      {isExpired(cupom.validUntil) && (
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
                      >
                        <EditIcon size={16} />
                      </Button>
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        color="danger"
                        onPress={() => handleToggleStatus(cupom.id, cupom.isActive)}
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Código</label>
                        <p className="text-lg font-mono font-bold">{selectedCupom.code}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Status</label>
                        <Chip 
                          color={isActive(selectedCupom) ? "success" : "danger"} 
                          variant="flat"
                        >
                          {isActive(selectedCupom) ? "Ativo" : "Inativo"}
                        </Chip>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-500">Descrição</label>
                      <p className="text-lg">{selectedCupom.description}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Tipo de Desconto</label>
                        <Chip variant="flat">
                          {selectedCupom.discountType === "PERCENTAGE" ? "Percentual" : "Valor Fixo"}
                        </Chip>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Valor do Desconto</label>
                        <p className="text-lg font-bold text-green-600">
                          {formatDiscount(selectedCupom)}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Valor Mínimo</label>
                        <p className="text-lg">R$ {selectedCupom.minValue.toLocaleString('pt-BR')}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Usos</label>
                        <p className="text-lg">
                          {selectedCupom.currentUses} de {selectedCupom.maxUses}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Evento</label>
                        <p className="text-lg">{selectedCupom.eventName || "Todos os eventos"}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Válido de</label>
                        <p className="text-lg">{moment(selectedCupom.validFrom).format('DD/MM/YYYY HH:mm')}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Válido até</label>
                        <p className="text-lg">{moment(selectedCupom.validUntil).format('DD/MM/YYYY HH:mm')}</p>
                      </div>
                    </div>

                    {isExpired(selectedCupom.validUntil) && (
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
    </div>
  );
} 