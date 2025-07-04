"use client"
import { ChangeEvent, useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useAuth } from "@/context/authContext";

import { Accordion, AccordionItem, Avatar, BreadcrumbItem, Breadcrumbs, Button, Divider, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Pagination, Switch, useDisclosure, Select, SelectItem, Chip, Card, CardBody, CardHeader, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Image } from "@nextui-org/react";
import { BanknotesIcon, MagnifyingGlassCircleIcon, PhotoIcon, PlusCircleIcon, TicketIcon, TrashIcon, EyeIcon, CalendarIcon, MapPinIcon, UsersIcon } from "@heroicons/react/24/outline";
import type { Event } from "@/types/Letsgo";
import axios from "axios";
import moment from "moment";
import { useRouter } from "next-nprogress-bar";
import "moment/locale/pt-br"
import { useAtom } from "jotai";

interface Props {
    events: Event[]
}

interface Establishment {
    id: string;
    name: string;
    address: string;
    ownerId: string;
}

const rowsPerPage = 10
export function ListEvents({ events }: Props) {
    const { user, token } = useAuth();
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [selectedPhoto, setSelectedPhoto] = useState<File>()
    const [loading, setLoading] = useState(false)
    const [isTicketsSale, steIsTicketSale] = useState(false)
    const [page, setPage] = useState(1)
    const [filterValue, setFilterValue] = useState("");
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const hasSearchFilter = Boolean(filterValue);

    // Novos estados para estabelecimentos e aprovação
    const [establishments, setEstablishments] = useState<Establishment[]>([]);
    const [selectedEstablishment, setSelectedEstablishment] = useState<string>("");
    const [loadingEstablishments, setLoadingEstablishments] = useState(false);

    const [ticketForm, setTicketForm] = useState(
        {
            description: "",
            price: "",
            quantity_available: ""
        }
    )

    const [ticketsData, setTicketsData] = useState<any[]>([])
    const [eventForm, setEventForm] = useState({
        name: "",
        dateTimestamp: "",
        description: "",
        address: "",
    })

    // Verificar se é promoter
    const isPromoter = user?.type === "PROFESSIONAL_PROMOTER";
    const isOwner = user?.type === "PROFESSIONAL_OWNER";

    // Buscar estabelecimentos disponíveis para promoters
    const fetchEstablishments = async () => {
        if (!isPromoter || !token) return;

        setLoadingEstablishments(true);
        try {
            const response = await axios.get('/api/establishment/available-for-promoters', {
                headers: {
                    'authorization': `Bearer ${token}`
                }
            });
            
            setEstablishments(response.data.establishments || []);
        } catch (error) {
            console.error('Erro ao buscar estabelecimentos:', error);
        } finally {
            setLoadingEstablishments(false);
        }
    };

    // Verificar se o estabelecimento selecionado precisa de aprovação
    const needsApproval = useMemo(() => {
        if (!isPromoter || !selectedEstablishment) return false;
        
        const establishment = establishments.find(est => est.id === selectedEstablishment);
        return establishment && establishment.ownerId !== user?.uid;
    }, [selectedEstablishment, establishments, isPromoter, user?.uid]);

    useEffect(() => {
        if (isPromoter) {
            fetchEstablishments();
        }
    }, [isPromoter, token]);

    const moneyMask = (e: ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace('.', '').replace(',', '').replace(/\D/g, '')

        const options = { minimumFractionDigits: 2 }
        const result = new Intl.NumberFormat('pt-BR', options).format(
            parseFloat(value) / 100
        )

        setTicketForm(prev => ({ ...prev, price: result }))
    }

    const previewImage = useMemo(() => {
        let uri: string = ""

        if (typeof window !== "undefined") {
            if (selectedPhoto) uri = window.URL.createObjectURL(selectedPhoto!) ?? "";
        }

        return uri

    }, [selectedPhoto])

    const filteredItems = useMemo(() => {
        if (!events || !Array.isArray(events)) return []
        let filtered = [...events];

        if (hasSearchFilter) {
            filtered = filtered.filter((item) => item.name.toLowerCase().includes(filterValue.toLowerCase()) ||
                item.description.toLowerCase().includes(filterValue.toLowerCase()));
        }

        return filtered;
    }, [events, filterValue]);

    const pages = Math.ceil(filteredItems.length / rowsPerPage);

    const items = useMemo(() => {
        const start = (page - 1) * rowsPerPage;
        const end = start + rowsPerPage;

        return filteredItems.slice(start, end);
    }, [page, filteredItems, rowsPerPage]);

    const onSearchChange = useCallback((value?: string) => {
        if (value) {
            setFilterValue(value);
            setPage(1);
        } else {
            setFilterValue("");
        }
    }, []);

    const handleOnChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        const keyName = name as keyof typeof eventForm

        setEventForm(prev => ({
            ...prev,
            [keyName]: value
        }))

    }

    const handleRemoveTicket = (index: number) => {
        const copy = [...ticketsData]
        copy.splice(index, 1)
        setTicketsData(prev => ([...copy]))
    }
    const handleAddTicket = () => {
        if (Object.values(ticketForm).some(v => !v.length) || ticketsData.map(v => v.description).includes(ticketForm.description)) {
            return
        }

        setTicketsData((prev: any) => ([...prev, {
            description: ticketForm.description,
            price: Number(String(ticketForm.price).replace("R$", '').replaceAll('.', '').replace(',', '.')),
            quantity_available: Number(ticketForm.quantity_available)
        }]))
    }

    const handleSubmit = async () => {
        try {
            setLoading(true)

            if (Object.values(eventForm).some(value => !value.length) || !selectedPhoto) {
                setError("Preencha todos os campos")
                return
            }

            // Validação específica para promoters
            if (isPromoter && !selectedEstablishment) {
                setError("Selecione um estabelecimento para o evento")
                return
            }

            // Upload da imagem via API route
            const uploadFormData = new FormData();
            uploadFormData.append('file', selectedPhoto!);
            uploadFormData.append('email', user?.email || '');

            const uploadResponse = await axios.post('/api/upload', uploadFormData);
            const imageUrl = uploadResponse.data.url;

            // Determinar o establishmentId baseado no tipo de usuário
            let establishmentId = selectedEstablishment;
            if (isOwner) {
                establishmentId = user?.establishmentId;
            }

            const formData = {
                ...eventForm,
                establishmentId: establishmentId || '',
                dateTimestamp: moment(eventForm.dateTimestamp).toISOString(),
                photos: [imageUrl],
                tickets: ticketsData,
                needsApproval: needsApproval, // Novo campo para indicar se precisa de aprovação
                promoterId: isPromoter ? user?.uid : null // ID do promoter se aplicável
            }

            await axios.post('/api/event/create', formData, {
                headers: {
                    'authorization': `Bearer ${token}`
                }
            })

            setTicketsData([])
            setEventForm({
                name: "",
                dateTimestamp: "",
                description: "",
                address: "",
            })
            setSelectedEstablishment("")

            // Mensagem diferente baseada na aprovação
            if (needsApproval) {
                setError("Seu evento foi criado com sucesso e está aguardando aprovação do proprietário do estabelecimento!")
            } else {
                setError("Seu evento foi criado com sucesso!")
            }
            
            onClose()

        } catch (error) {
            console.error(error);
            setError("Ocorreu um erro")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        localStorage.removeItem("@evets-letsgo")
        localStorage.setItem("@evets-letsgo", JSON.stringify(events))
    }, [events])

    const handleViewEvent = (event: Event) => {
        setSelectedEvent(event);
        onOpenDetails();
    };

    const getStatusColor = (status?: string) => {
        switch (status) {
            case "PENDING": return "warning";
            case "APPROVED": return "success";
            case "REJECTED": return "danger";
            default: return "default";
        }
    };

    const getStatusText = (status?: string) => {
        switch (status) {
            case "PENDING": return "Aguardando Aprovação";
            case "APPROVED": return "Aprovado";
            case "REJECTED": return "Rejeitado";
            default: return "Ativo";
        }
    };

    const [error, setError] = useState<string | null>(null)

    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const { isOpen: isOpenModalTicket, onOpen: onOpenModalTicket, onOpenChange: onOpenChangeModalTicket } = useDisclosure();
    const { isOpen: isOpenDetails, onOpen: onOpenDetails, onOpenChange: onOpenChangeDetails } = useDisclosure();
    const [isOpenTicketsModal, setIsOpenTicketsModal] = useState(false);
    const [selectedTicketsEvent, setSelectedTicketsEvent] = useState<Event | null>(null);

    // Função para abrir o modal de tickets
    const handleOpenTicketsModal = (event: Event) => {
        setSelectedTicketsEvent(event);
        setIsOpenTicketsModal(true);
    };
    // Função para fechar o modal de tickets
    const handleCloseTicketsModal = () => {
        setIsOpenTicketsModal(false);
        setSelectedTicketsEvent(null);
    };

    return (
        <div className="space-y-6 w-full max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-2">
                <h1 className="text-2xl font-bold text-theme-primary">Meus Eventos</h1>
                <Button
                    onPress={() => router.push('/dashboard/eventos/novo')}
                    className="bg-[#FF6600] text-white font-bold shadow-none"
                    endContent={<PlusCircleIcon className="w-5 h-5" />}>
                    Novo Evento
                </Button>
            </div>

            <Card className="bg-content1 border-none shadow-none">
                <CardHeader className="pb-0">
                    <Input
                        placeholder="Buscar eventos..."
                        startContent={<MagnifyingGlassCircleIcon className="w-5 h-5 text-default-400" />}
                        value={filterValue}
                        onChange={(e) => setFilterValue(e.target.value)}
                        className="max-w-xs input-theme"
                        size="sm"
                        variant="bordered"
                    />
                </CardHeader>
                <CardBody className="pt-2">
                    <Table aria-label="Tabela de eventos" removeWrapper className="table-auto text-sm">
                        <TableHeader className="bg-transparent">
                            <TableColumn>EVENTO</TableColumn>
                            <TableColumn className="min-w-[200px]">LOCAL</TableColumn>
                            <TableColumn>DATA</TableColumn>
                            <TableColumn>STATUS</TableColumn>
                            <TableColumn>INGRESSOS</TableColumn>
                            <TableColumn>Administradores</TableColumn>
                        </TableHeader>
                        <TableBody
                            // itemKey removido, não existe na tipagem do TableBody
                            emptyContent={!events.length ? "Nenhum evento encontrado" : "Carregando..."}
                            items={items}
                        >
                            {(event) => (
                                <TableRow key={event.id} className="hover:bg-content2 transition border-b border-default-100">
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {event.photos && event.photos.length > 0 && (
                                                <Image
                                                    src={event.photos[0]}
                                                    alt={event.name || "Sem nome"}
                                                    className="w-10 h-10 rounded object-cover border border-default-200"
                                                />
                                            )}
                                            <div>
                                                <p className="font-bold text-theme-primary leading-tight text-lg">{event.name || "Sem nome"}</p>
                                                <p className="text-xs text-theme-secondary line-clamp-1">{event.description || ""}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="min-w-[200px]">
                                        <div>
                                            <p className="font-medium text-theme-primary leading-tight">{event.establishment?.name ? String(event.establishment.name) : '-'}</p>
                                            {/* Endereço removido */}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1">
                                            <CalendarIcon className="w-4 h-4 text-default-400" />
                                            <span className="text-theme-primary font-medium">
                                                {event.dateTimestamp ? moment(event.dateTimestamp).format('DD/MM/YYYY HH:mm') : ""}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Chip color={getStatusColor(event.approvalStatus) as any} variant="flat" size="sm" className="text-xs px-2">
                                            {getStatusText(event.approvalStatus)}
                                        </Chip>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2 justify-center">
                                            <Button
                                                isIconOnly
                                                size="sm"
                                                variant="light"
                                                className="text-default-500"
                                                onPress={() => handleOpenTicketsModal(event)}
                                                title="Ingressos"
                                            >
                                                <TicketIcon className="w-5 h-5" />
                                            </Button>
                                            <span className="text-xs text-theme-secondary font-semibold">
                                                {event.tickets ? event.tickets.length : 0}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {/* Exibir nomes dos administradores, se disponíveis */}
                                        {event.managers && event.managers.length > 0 ? (
                                            <div className="flex flex-col gap-1">
                                                {event.managers.map((manager: any) => (
                                                    <span key={manager.id} className="text-xs text-theme-primary font-medium">
                                                        {manager.name}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-xs text-theme-secondary">-</span>
                                        )}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>

                    {pages > 1 && (
                        <div className="flex justify-center mt-2">
                            <Pagination
                                total={pages}
                                page={page}
                                onChange={setPage}
                                showControls
                                size="sm"
                            />
                        </div>
                    )}
                </CardBody>
            </Card>
            <Modal hideCloseButton isDismissable={false} size="4xl" isOpen={isOpen} onOpenChange={onOpenChange}>
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1">Novo Evento</ModalHeader>
                            <ModalBody>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="flex flex-col gap-4">
                                        <Input
                                            label="Nome do Evento"
                                            name="name"
                                            placeholder="Digite o nome do evento"
                                            maxLength={99}
                                            value={eventForm.name}
                                            onChange={handleOnChange}
                                            isRequired
                                        />
                                        <label className="text-sm font-medium text-theme-tertiary">Descrição</label>
                                        <textarea
                                            name="description"
                                            placeholder="Descreva o evento"
                                            maxLength={255}
                                            value={eventForm.description}
                                            onChange={handleOnChange}
                                            rows={5}
                                            className="rounded-md border border-default-200 px-3 py-2 text-theme-primary bg-white shadow-sm focus:ring-2 focus:ring-accent-primary resize-y min-h-[100px]"
                                            required
                                        />
                                        <Input
                                            type="datetime-local"
                                            label="Data e Hora"
                                            name="dateTimestamp"
                                            value={eventForm.dateTimestamp || ""}
                                            onChange={handleOnChange}
                                            isRequired
                                        />
                                    </div>
                                    <div className="flex flex-col gap-4">
                                        {/* Upload de imagem */}
                                        <label className="block text-sm font-medium text-theme-tertiary">Imagem do Evento</label>
                                        <div className="flex items-center gap-4">
                                            <Avatar
                                                src={previewImage}
                                                icon={<PhotoIcon className="w-10 h-10" />}
                                                className="w-24 h-24 text-large border border-default-200" />
                                            <label
                                                htmlFor="file-upload-event"
                                                className="cursor-pointer rounded-md bg-[#FF6600] px-4 py-2 text-white font-semibold hover:bg-orange-600 transition"
                                            >
                                                {selectedPhoto ? "Alterar" : "Selecionar"}
                                                <input
                                                    accept="image/*"
                                                    id="file-upload-event"
                                                    name="file-upload-event"
                                                    onChange={e => setSelectedPhoto(e.target.files![0])}
                                                    type="file"
                                                    className="sr-only" />
                                            </label>
                                        </div>
                                        {/* Para PROMOTER, mostrar seletor de estabelecimento */}
                                        {isPromoter && (
                                            <Select
                                                label="Buscar Estabelecimento"
                                                placeholder="Digite o nome do estabelecimento"
                                                selectedKeys={selectedEstablishment ? [selectedEstablishment] : []}
                                                onSelectionChange={(keys) => {
                                                    const selected = Array.from(keys)[0] as string;
                                                    setSelectedEstablishment(selected);
                                                }}
                                                isLoading={loadingEstablishments}
                                                isRequired
                                            >
                                                {establishments.map((establishment) => (
                                                    <SelectItem key={establishment.id} value={establishment.id}>
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">{establishment.name}</span>
                                                            <span className="text-xs text-gray-500">{establishment.address}</span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </Select>
                                        )}
                                    </div>
                                </div>
                            </ModalBody>
                            <ModalFooter>
                                <Button
                                    isDisabled={loading}
                                    color="danger"
                                    variant="light"
                                    onPress={onClose}>
                                    Cancelar
                                </Button>
                                <Button
                                    isLoading={loading}
                                    isDisabled={loading}
                                    className="bg-[#FF6600] text-white font-bold"
                                    onPress={handleSubmit}>
                                    Criar Evento
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
            <Modal hideCloseButton size="4xl" isOpen={isOpenModalTicket} onOpenChange={onOpenChangeModalTicket}>
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1">Novo ticket</ModalHeader>
                            <ModalBody>

                                <Input
                                    label="Descrição do ingresso"
                                    value={ticketForm.description}
                                    onChange={({ target: { value } }) => {
                                        setTicketForm(prev => ({
                                            ...prev,
                                            description: value
                                        }))
                                    }}
                                    placeholder="Masculino - Pista"
                                />

                                <Input
                                    type="number"
                                    label="Quantidade"
                                    value={ticketForm.quantity_available}
                                    onChange={({ target: { value } }) => {
                                        setTicketForm(prev => ({
                                            ...prev,
                                            quantity_available: value
                                        }))
                                    }}
                                    placeholder="10"
                                    maxLength={999}
                                />

                                <Input
                                    label="Valor"
                                    placeholder="R$ 100,00"
                                    value={ticketForm.price}
                                    onChange={moneyMask}
                                />
                            </ModalBody>
                            <ModalFooter>
                                <Button
                                    color="danger"
                                    variant="light"
                                    onPress={onClose}>
                                    Fechar
                                </Button>
                                <Button
                                    className="bg-[#FF6600] text-white font-bold"
                                    onPress={handleAddTicket}>
                                    Adicionar
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>

            {/* Modal de Detalhes do Evento */}
            <Modal isOpen={isOpenDetails} onOpenChange={onOpenChangeDetails} size="4xl">
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
                                                <Chip color={getStatusColor(selectedEvent.approvalStatus) as any} variant="flat" size="lg">
                                                    {getStatusText(selectedEvent.approvalStatus)}
                                                </Chip>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-sm font-medium text-theme-tertiary">Descrição</label>
                                            <p className="text-lg text-theme-primary">{selectedEvent.description}</p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="text-sm font-medium text-theme-tertiary">Data e Hora</label>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <CalendarIcon className="w-4 h-4" />
                                                    <p className="text-lg text-theme-primary">{moment(selectedEvent.dateTimestamp).format('DD/MM/YYYY HH:mm')}</p>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-theme-tertiary">Criado em</label>
                                                <p className="text-lg text-theme-primary">{moment(selectedEvent.createdAt).format('DD/MM/YYYY HH:mm')}</p>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-sm font-medium text-theme-tertiary">Estabelecimento</label>
                                            <div className="mt-1">
                                                <p className="font-medium text-theme-primary">{selectedEvent.establishment?.name || "Sem estabelecimento"}</p>
                                                <div className="flex items-center gap-2 text-theme-secondary">
                                                    <MapPinIcon className="w-4 h-4" />
                                                    <span>{selectedEvent.establishment?.address || ""}</span>
                                                </div>
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

                                        {selectedEvent.needsApproval && (
                                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                                <div className="flex items-center gap-2">
                                                    <Chip color="warning" variant="flat" size="sm">
                                                        ⚠️ Aprovação Necessária
                                                    </Chip>
                                                </div>
                                                <p className="text-sm text-yellow-800 mt-2">
                                                    Este evento precisará ser aprovado pelo proprietário do estabelecimento antes de ser publicado.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </ModalBody>
                            <ModalFooter>
                                <Button color="danger" variant="light" onPress={onClose}>
                                    Fechar
                                </Button>
                                <Button 
                                    className="bg-[#FF6600] text-white font-bold"
                                    onPress={() => {
                                        onClose();
                                        router.push(`/dashboard/eventos/${selectedEvent?.id}`);
                                    }}
                                >
                                    Gerenciar Evento
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>

            {/* Modal de Tickets do Evento Selecionado */}
            <Modal isOpen={isOpenTicketsModal} onOpenChange={handleCloseTicketsModal} size="lg">
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader>Ingressos de {selectedTicketsEvent?.name}</ModalHeader>
                            <ModalBody>
                                {selectedTicketsEvent?.tickets && selectedTicketsEvent.tickets.length > 0 ? (
                                    selectedTicketsEvent.tickets.map((ticket: any) => (
                                        <Card key={ticket.id} className="mb-2">
                                            <CardBody className="flex flex-row items-center justify-between">
                                                <div>
                                                    <span className="font-medium">{ticket.description}</span> - R$ {ticket.price} ({ticket.quantity_available} unid.)
                                                </div>
                                                <div>
                                                    <Button size="sm" color="primary" className="mr-2">Editar</Button>
                                                    <Button size="sm" color="danger">Remover</Button>
                                                </div>
                                            </CardBody>
                                        </Card>
                                    ))
                                ) : (
                                    <div>Nenhum ingresso cadastrado para este evento.</div>
                                )}
                            </ModalBody>
                            <ModalFooter>
                                <Button color="default" variant="light" onPress={onClose}>Fechar</Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </div>
    )
}