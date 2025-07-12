"use client"
import { ChangeEvent, useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useAuth } from "@/context/authContext";

import { Accordion, AccordionItem, Avatar, BreadcrumbItem, Breadcrumbs, Button, Divider, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Pagination, Switch, useDisclosure, Select, SelectItem, Chip, Card, CardBody, CardHeader, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Image } from "@nextui-org/react";
import { BanknotesIcon, MagnifyingGlassCircleIcon, PhotoIcon, PlusCircleIcon, TicketIcon, TrashIcon, EyeIcon, CalendarIcon, MapPinIcon, UsersIcon, PlusIcon } from "@heroicons/react/24/outline";
import type { Event } from "@/types/Letsgo";
import axios from "axios";
import moment from "moment-timezone";
import { useRouter } from "next-nprogress-bar";
import "moment/locale/pt-br"
import { useAtom } from "jotai";
import { ModalFormTicket } from "@/components/ModalFormTicket";

interface Props {
    events: Event[]
    onEventsUpdate?: () => void
}

interface Establishment {
    id: string;
    name: string;
    address: string;
    ownerId: string;
}

const rowsPerPage = 10
export function ListEvents({ events, onEventsUpdate }: Props) {
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
            // console.error('Erro ao buscar estabelecimentos:', error);
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
            
            // Comprimir imagem antes do upload
            const compressedPhoto = await compressImage(selectedPhoto!);
            uploadFormData.append('file', compressedPhoto);
            uploadFormData.append('email', user?.email || '');

            const uploadUrl = process.env.NEXT_PUBLIC_IMAGE_UPLOAD_URL || '/api/upload';
            const uploadResponse = await axios.post(uploadUrl, uploadFormData);
            const imageUrl = uploadResponse.data.url;

            // Determinar o establishmentId baseado no tipo de usuário
            let establishmentId = selectedEstablishment;
            if (isOwner) {
                establishmentId = user?.establishmentId || '';
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
            
        } catch (error) {
            // console.error(error);
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
            case "FINALIZADO": return "default";
            default: return "success";
        }
    };

    const getStatusText = (status?: string) => {
        switch (status) {
            case "PENDING": return "Aguardando Aprovação";
            case "APPROVED": return "Aprovado";
            case "REJECTED": return "Rejeitado";
            case "FINALIZADO": return "Finalizado";
            default: return "Ativo";
        }
    };

    const [error, setError] = useState<string | null>(null)

    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const { isOpen: isOpenModalTicket, onOpen: onOpenModalTicket, onOpenChange: onOpenChangeModalTicket } = useDisclosure();
    const { isOpen: isOpenDetails, onOpen: onOpenDetails, onOpenChange: onOpenChangeDetails } = useDisclosure();
    
    // Estados para vinculação de recepcionistas
    const { isOpen: isOpenReceptionistModal, onOpen: onOpenReceptionistModal, onOpenChange: onOpenChangeReceptionistModal } = useDisclosure();
    const [selectedEventForReceptionist, setSelectedEventForReceptionist] = useState<Event | null>(null);
    const [availableReceptionists, setAvailableReceptionists] = useState<any[]>([]);
    const [loadingReceptionists, setLoadingReceptionists] = useState(false);
    const [isOpenTicketsModal, setIsOpenTicketsModal] = useState(false);
    const [selectedTicketsEvent, setSelectedTicketsEvent] = useState<Event | null>(null);

    // Adicionar estados para controlar o modal de ticket
    const [isOpenTicketForm, setIsOpenTicketForm] = useState(false);
    const [ticketToEdit, setTicketToEdit] = useState<any>(null);

    // Função para abrir modal de novo ticket
    const handleAddNewTicket = () => {
      setTicketToEdit(null);
      setIsOpenTicketForm(true);
    };

    // Função para abrir modal de edição de ticket
    const handleEditTicket = (ticket: any) => {
      setTicketToEdit(ticket);
      setIsOpenTicketForm(true);
    };

    // Função para atualizar tickets após salvar/editar
    const refreshTickets = async () => {
      if (!selectedTicketsEvent || !token) return;
      // Buscar evento atualizado
      const response = await axios.get(`/api/event/find-by-id/${selectedTicketsEvent.id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setSelectedTicketsEvent(response.data.event);
      if (onEventsUpdate) onEventsUpdate();
    };

    // Função para deletar ticket
    const handleDeleteTicket = async (ticketId: string) => {
      if (!token || !selectedTicketsEvent) return;

      try {
        await axios.delete(`/api/ticket/delete/${ticketId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        // Atualizar a lista de tickets
        await refreshTickets();
      } catch (error: any) {
        // console.error('Erro ao deletar ticket:', error);
        setError('Erro ao deletar ticket');
      }
    };

    // Função para abrir o modal de tickets
    const handleOpenTicketsModal = (event: Event) => {
        if (!event?.id) {
            alert('Evento inválido. Não é possível gerenciar ingressos para este evento.');
            return;
        }
        setSelectedTicketsEvent(event);
        setIsOpenTicketsModal(true);
    };
    // Função para fechar o modal de tickets
    const handleCloseTicketsModal = () => {
        setIsOpenTicketsModal(false);
        setSelectedTicketsEvent(null);
    };

    // Função para abrir o modal de vinculação de recepcionistas
    const handleOpenReceptionistModal = async (event: Event) => {
        setSelectedEventForReceptionist(event);
        setAvailableReceptionists([]);
        onOpenReceptionistModal();
        
        // Carregar automaticamente todos os recepcionistas disponíveis
        await loadAllAvailableReceptionists();
    };

    // Função para carregar todos os recepcionistas disponíveis
    const loadAllAvailableReceptionists = async () => {
        if (!token) return;

        setLoadingReceptionists(true);
        try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/ticket-takers`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            
            setAvailableReceptionists(response.data.ticketTakers || []);
        } catch (error: any) {
            // console.error('Erro ao carregar recepcionistas:', error);
            setAvailableReceptionists([]);
        } finally {
            setLoadingReceptionists(false);
        }
    };

    // Função para vincular recepcionista ao evento
    const linkReceptionistToEvent = async (receptionistId: string) => {
        if (!selectedEventForReceptionist || !token) return;

        try {
            const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/event-manager/create`, {
                eventId: selectedEventForReceptionist.id,
                userUid: receptionistId
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            // Fechar o modal e atualizar os dados
            onOpenChangeReceptionistModal();
            if (onEventsUpdate) {
                onEventsUpdate();
            }
        } catch (error: any) {
            let msg = 'Erro ao vincular recepcionista ao evento';
            if (error?.response?.data?.message) {
                if (typeof error.response.data.message === 'string' && error.response.data.message.includes('já está vinculado')) {
                    msg = 'Este recepcionista já está vinculado a este evento.';
                } else {
                    msg = error.response.data.message;
                }
            }
            setError(msg);
        }
    };

    // Função para desvincular recepcionista do evento
    const unlinkReceptionistFromEvent = async (eventId: string, receptionistId: string) => {
        if (!token) return;

        try {
            // Primeiro, buscar o event manager para obter o ID
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/event-manager/find-by-event/${eventId}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const eventManager = response.data.managers.find((manager: any) => manager.user.id === receptionistId);
            
            if (!eventManager) {
                setError('Recepcionista não encontrado neste evento');
                return;
            }

            // Deletar o event manager
            await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/event-manager/delete/${eventManager.id}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            // Atualizar os dados sem recarregar a página
            if (onEventsUpdate) {
                onEventsUpdate();
            }
        } catch (error: any) {
            // console.error('Erro ao desvincular recepcionista:', error);
            setError('Erro ao desvincular recepcionista do evento');
        }
    };

    // Função para comprimir imagem
    const compressImage = (file: File): Promise<File> => {
      return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
          // Calcular novas dimensões mantendo proporção
          const maxWidth = 960; // Aumentado para 960px
          const maxHeight = 720; // Aumentado para 720px
          let { width, height } = img;

          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }

          canvas.width = width;
          canvas.height = height;

          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: file.type,
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                resolve(file);
              }
            },
            file.type,
            0.75 // Qualidade melhorada para 75%
          );
        };

        img.src = URL.createObjectURL(file);
      });
    };

    return (
        <div className="space-y-6 w-full max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-2">
                <h1 className="text-2xl font-bold text-theme-primary">
                    {isOwner ? "Todos os Eventos" : "Meus Eventos"}
                </h1>
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
                            <TableColumn>FOTO</TableColumn>
                            <TableColumn>EVENTO</TableColumn>
                            <TableColumn className="min-w-[200px]">LOCAL</TableColumn>
                            <TableColumn>DATA</TableColumn>
                            <TableColumn>STATUS</TableColumn>
                            <TableColumn>CRIADO POR</TableColumn>
                            <TableColumn>INGRESSOS</TableColumn>
                            <TableColumn>RECEPCIONISTAS</TableColumn>
                            <TableColumn>DETALHES</TableColumn>
                        </TableHeader>
                        <TableBody
                            emptyContent={!events.length ? "Nenhum evento encontrado" : "Carregando..."}
                            items={items}
                        >
                            {(event) => (
                                <TableRow key={event.id} className="hover:bg-content2 transition border-b border-default-100">
                                    {/* 1. FOTO */}
                                    <TableCell>
                                        {event.photos && event.photos.length > 0 ? (
                                            <Image
                                                src={event.photos[0]}
                                                alt={event.name || "Sem nome"}
                                                className="w-12 h-12 rounded-lg object-cover border border-default-200 shadow-sm"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 rounded-lg bg-default-100 border border-default-200 flex items-center justify-center">
                                                <PhotoIcon className="w-6 h-6 text-default-400" />
                                            </div>
                                        )}
                                    </TableCell>
                                    {/* 2. EVENTO */}
                                    <TableCell>
                                        <div>
                                            <p className="font-bold text-theme-primary leading-tight text-lg">{event.name || "Sem nome"}</p>
                                            <p className="text-xs text-theme-secondary line-clamp-1">{event.description || ""}</p>
                                        </div>
                                    </TableCell>
                                    {/* 3. LOCAL */}
                                    <TableCell className="min-w-[200px]">
                                        <p className="font-medium text-theme-primary leading-tight">{event.establishment?.name ? String(event.establishment.name) : '-'}</p>
                                    </TableCell>
                                    {/* 4. DATA */}
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-1">
                                                <CalendarIcon className="w-4 h-4 text-default-400" />
                                                <span className="text-theme-primary font-medium text-sm">
                                                    {event.dateTimestamp ? moment(String(event.dateTimestamp)).format('DD/MM/YYYY') : ""}
                                                </span>
                                            </div>
                                            <div className="flex flex-col text-xs text-default-500">
                                                <span>
                                                    <strong>Início:</strong> {event.dateTimestamp ? moment(String(event.dateTimestamp)).format('HH:mm') : ""}
                                                </span>
                                                {event.endTimestamp && (
                                                    <span>
                                                        <strong>Término:</strong> {moment(String(event.endTimestamp)).format('HH:mm')}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </TableCell>
                                    {/* 5. STATUS */}
                                    <TableCell>
                                        <Chip color={getStatusColor(event.approvalStatus) as any} variant="flat" size="sm" className="text-xs px-2">
                                            {getStatusText(event.approvalStatus)}
                                        </Chip>
                                    </TableCell>
                                    {/* 6. CRIADO POR */}
                                    <TableCell>
                                        <div className="flex items-center gap-1">
                                            <UsersIcon className="w-4 h-4 text-default-400" />
                                            <span className="text-theme-primary font-medium">
                                                {isOwner 
                                                    ? (event.creator?.name || (event.useruid === user?.uid ? "Você" : "-"))
                                                    : "-"
                                                }
                                            </span>
                                        </div>
                                    </TableCell>
                                    {/* 7. INGRESSOS */}
                                    <TableCell>
                                        <Button
                                            variant="light"
                                            className="flex items-center gap-2 justify-center"
                                            isDisabled={isOwner && event.creator?.type === 'PROFESSIONAL_PROMOTER'}
                                            onPress={() => {
                                                handleOpenTicketsModal(event)
                                            }}
                                            title="Gerenciar Ingressos"
                                        >
                                            <TicketIcon className="w-5 h-5 text-default-400" />
                                            <span className="text-theme-primary font-medium">
                                                {event.tickets ? event.tickets.length : 0}
                                            </span>
                                        </Button>
                                    </TableCell>
                                    {/* 8. RECEPCIONISTAS */}
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {event.managers && event.managers.length > 0 ? (
                                                <>
                                                    {event.managers.map((manager: any) => (
                                                        <span key={manager.id} className="flex items-center gap-1">
                                                            <span className="text-xs text-theme-primary font-medium">
                                                                {manager.user?.name || manager.name}
                                                            </span>
                                                            <Button
                                                                isIconOnly
                                                                size="sm"
                                                                variant="light"
                                                                color="danger"
                                                                className="text-danger-500"
                                                                isDisabled={isOwner && event.creator?.type === 'PROFESSIONAL_PROMOTER'}
                                                                onPress={() => {
                                                                    unlinkReceptionistFromEvent(event.id, manager.user?.uid)
                                                                }}
                                                                title="Remover Recepcionista"
                                                            >
                                                                <TrashIcon className="w-3 h-3" />
                                                            </Button>
                                                        </span>
                                                    ))}
                                                </>
                                            ) : (
                                                <span>-</span>
                                            )}
                                            <Button
                                                isIconOnly
                                                size="sm"
                                                variant="light"
                                                className="text-default-500"
                                                isDisabled={isOwner && event.creator?.type === 'PROFESSIONAL_PROMOTER'}
                                                onPress={() => {
                                                    handleOpenReceptionistModal(event)
                                                }}
                                                title="Vincular Recepcionistas"
                                            >
                                                <PlusIcon className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                    {/* 9. DETALHES */}
                                    <TableCell>
                                        <Button
                                            isIconOnly
                                            size="sm"
                                            variant="light"
                                            className="text-default-500"
                                            onPress={() => handleViewEvent(event)}
                                            title="Ver detalhes do evento"
                                        >
                                            <EyeIcon className="w-5 h-5" />
                                        </Button>
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
            <Modal hideCloseButton isDismissable={!loading} size="4xl" isOpen={isOpen} onOpenChange={onOpenChange}>
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1">
                                {loading ? (
                                    <div className="flex items-center gap-2">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#FF6600]"></div>
                                        Criando evento...
                                    </div>
                                ) : (
                                    "Novo Evento"
                                )}
                            </ModalHeader>
                            <ModalBody>
                                {loading && (
                                    <div className="flex flex-col items-center justify-center py-8">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6600] mb-4"></div>
                                        <p className="text-lg font-medium text-gray-600">Criando seu evento...</p>
                                        <p className="text-sm text-gray-500 mt-2">Isso pode levar alguns segundos</p>
                                    </div>
                                )}
                                {!loading && (
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
                                )}
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
                                    <div className="space-y-6 max-h-[90vh] overflow-y-auto mt-4 mb-4">
                                        {/* Foto principal no topo */}
                                        {selectedEvent.photos && selectedEvent.photos.length > 0 && (
                                            <div className="w-full flex justify-center">
                                                <Image
                                                    src={selectedEvent.photos[0]}
                                                    alt={selectedEvent.name}
                                                    className="w-full max-w-2xl h-64 object-cover rounded-xl mb-6 shadow-lg"
                                                />
                                            </div>
                                        )}
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
                                            <p className="text-lg text-theme-primary whitespace-pre-line">{selectedEvent.description}</p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="text-sm font-medium text-theme-tertiary">Data e Hora</label>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <CalendarIcon className="w-4 h-4" />
                                                    <p className="text-lg text-theme-primary">{moment(String(selectedEvent.dateTimestamp || "")).format('DD/MM/YYYY HH:mm')}</p>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-theme-tertiary">Criado em</label>
                                                <p className="text-lg text-theme-primary">{moment(String(selectedEvent.createdAt || "")).format('DD/MM/YYYY HH:mm')}</p>
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
                                <Button
                                    className="mb-4 bg-[#FF6600] text-white font-bold"
                                    onPress={handleAddNewTicket}
                                >
                                    Novo Ticket
                                </Button>
                                {selectedTicketsEvent?.tickets && selectedTicketsEvent.tickets.length > 0 ? (
                                    selectedTicketsEvent.tickets.map((ticket: any) => (
                                        <Card key={ticket.id} className="mb-2">
                                            <CardBody className="flex flex-row items-center justify-between">
                                                <div>
                                                    <span className="font-medium">{ticket.description}</span> - R$ {ticket.price} ({ticket.quantity_available} unid.)
                                                </div>
                                                <div>
                                                    <Button size="sm" color="primary" className="mr-2" onPress={() => handleEditTicket(ticket)}>Editar</Button>
                                                    <Button size="sm" color="danger" onPress={() => handleDeleteTicket(ticket.id)}>Remover</Button>
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

            {/* Modal de Vinculação de Recepcionistas */}
            <Modal isOpen={isOpenReceptionistModal} onOpenChange={onOpenChangeReceptionistModal} size="3xl">
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
                                                        <div key={receptionist.uid} className="flex items-center justify-between p-3 border rounded-lg hover:bg-blue-50 transition-colors">
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
                                                                onPress={() => linkReceptionistToEvent(receptionist.uid)}
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
            {error && (
                <div className="my-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded">
                    {error}
                </div>
            )}
            <ModalFormTicket
                isOpen={isOpenTicketForm}
                onClose={() => setIsOpenTicketForm(false)}
                eventId={selectedTicketsEvent?.id || ""}
                ticketToUpdate={ticketToEdit}
                callBack={refreshTickets}
            />
        </div>
    )
}   