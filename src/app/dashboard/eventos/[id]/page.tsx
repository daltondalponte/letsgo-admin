"use client"
import { Event } from "@/types/Letsgo";
import { CalendarIcon, ChevronDownIcon, CloudArrowDownIcon, EyeIcon, LinkIcon, MapPinIcon, PencilIcon, PlusCircleIcon, ReceiptPercentIcon, TagIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Accordion, AccordionItem, BreadcrumbItem, Breadcrumbs, Button, Card, CardBody, Spinner, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow, Tooltip, User, useDisclosure } from "@nextui-org/react";
import Image from "next/image";
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { animate, motion, useMotionValue, useTransform } from 'framer-motion';
import { EditIcon } from "@/components/EditEvent";
import { useSession } from "next-auth/react";
import { Menu, Transition } from "@headlessui/react";
import moment from "moment";
import "moment/locale/pt-br"
import { ModalFormTicket } from "@/components/ModalFormTicket";
import { ModalFormCupom } from "@/components/ModalCupomForm";
import { ModalAttachCupom } from "@/components/ModalAttachCupom";
import { ModalEditEvent } from "@/components/ModalEditEvent";
import firebase_app from "@/lib/firebase";
import { getDownloadURL, getStorage, ref as refStorage, uploadBytes } from "firebase/storage";
import axios from "axios";
import { ModalNewManager } from "@/components/ModalNewManager";
import { ModalNewTaker } from "@/components/ModalNewTaker";
import { makeDocDefinition } from "@/lib/docDefinitionSales";
import pdfMake from "pdfmake/build/pdfmake"
import pdfFonts from "pdfmake/build/vfs_fonts";

function classNames(...classes: any) {
    return classes.filter(Boolean).join(' ')
}

export default function Index({ params: { id } }: { params: { id: string } }) {
    const { data: session } = useSession()

    const [selectedTicket, setSelectedTicket] = useState<any>()
    const {
        isOpen: isOpenModalTicket,
        onOpen: onOpenModalTicket,
        onOpenChange: onOpenChangeModalTicket,
        onClose: onCloseModalTicket
    } = useDisclosure()

    const {
        isOpen: isOpenModalCupom,
        onOpen: onOpenModalCupom,
        onOpenChange: onOpenChangeModalCupom,
        onClose: onCloseModalCupom
    } = useDisclosure()

    const {
        isOpen: isOpenModalAttachCupom,
        onOpen: onOpenModalAttachCupom,
        onOpenChange: onOpenChangeModalAttachCupom,
        onClose: onCloseModalAttachCupom
    } = useDisclosure()

    const {
        isOpen: isOpenModalEditEvent,
        onOpen: onOpenModalEditEvent,
        onOpenChange: onOpenChangeModalEditEvent,
        onClose: onCloseModalEditEvent
    } = useDisclosure()

    const {
        isOpen: isOpenModalManager,
        onOpen: onOpenModalManager,
        onOpenChange: onOpenChangeModalManager,
        onClose: onCloseModalManager
    } = useDisclosure()

    const {
        isOpen: isOpenModalTaker,
        onOpen: onOpenModalTaker,
        onOpenChange: onOpenChangeModalTaker,
        onClose: onCloseModalTaker
    } = useDisclosure()

    const ticketsCount = useMotionValue(0)
    const ticketsValue = useTransform(ticketsCount, latest => Math.round(latest))

    const [ticketToUpdate, setTicketToUpdate] = useState<any>()
    const confirmedSalesCount = useMotionValue(0)
    const confirmedSales = useTransform(confirmedSalesCount, latest => Math.round(latest))

    const unConfirmedSalesCount = useMotionValue(0)
    const unConfirmedSales = useTransform(unConfirmedSalesCount, latest => Math.round(latest))

    const [event, setEvent] = useState<Event | null>(null)
    const [selectedPhoto, setSelectedPhoto] = useState<File>()

    const [tickets, setTickets] = useState<any[]>([])

    const [cupons, setCupons] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [loadingPhoto, setLoadingPhoto] = useState(false)

    const [managers, setManagers] = useState<any[]>([])
    const previewImage = useMemo(() => {
        let uri: string = ""

        if (typeof window !== "undefined") {
            if (selectedPhoto) uri = window.URL.createObjectURL(selectedPhoto!) ?? ""
        }

        return uri

    }, [selectedPhoto])

    const fetchTickets = async () => {
        try {
            setLoading(true)

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ticket/admin/find-by-event/${id}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'authorization': `Bearer ${session?.access_token}`
                }
            })

            const data = await res.json()

            if (data?.tickets) {
                if (selectedTicket) {
                    const f = data.tickets.find((t: any) => t.id === selectedTicket?.id)
                    setSelectedTicket(f)
                }
                setTickets(data.tickets)
            }
        } catch (error) {
            console.error(error);

        } finally {
            setLoading(false)
        }
    }

    const fetchCupons = async () => {
        try {

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cupom/findAllByEventId?eventId=${id}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'authorization': `Bearer ${session?.access_token}`
                }
            })

            const data = await res.json()

            if (data?.cupons) {
                setCupons(data.cupons)
            }
        } catch (error) {
            console.error(error);

        }
    }

    const fetchEvent = () => {
        const events = localStorage.getItem("@evets-letsgo")

        if (events) {
            const find = JSON.parse(events).find((e: any) => e.id === id)
            setEvent(find)
        }
    }

    useEffect(() => {
        if (!tickets.length) return

        const confirmedSales = tickets.flatMap(t => t.sales).filter(s => s.payment?.status === "COMPLETED")
        const unConfirmedSales = tickets.flatMap(t => t.sales).filter(s => s.payment?.status === "PENDING")

        const controlTicketValue = animate(ticketsCount, tickets.length, {
            delay: 0.2,
            duration: 0.5
        })

        const controlConfirmedSales = animate(confirmedSalesCount, confirmedSales.length, {
            delay: 0.3,
            duration: 0.5
        })

        const controlUnConfirmedSales = animate(unConfirmedSalesCount, unConfirmedSales.length, {
            delay: 0.4,
            duration: 0.5
        })

        return () => {
            controlTicketValue.stop()
            controlConfirmedSales.stop()
            controlUnConfirmedSales.stop()
        }
    }, [tickets])

    useEffect(() => {
        fetchEvent()
    }, [id])

    useEffect(() => {
        if (session && event?.id) {
            handleFetchManagers()
            fetchCupons()
            fetchTickets()
        }
    }, [session, event])

    const handleDeleteTaker = async (id: string) => {
        try {
            if (id === session?.user.uid) return
            const { data } = await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/events-manager/delete/${event?.id}/${id}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'authorization': `Bearer ${session?.access_token}`
                }
            })

            await handleFetchManagers()
        } catch (error) {

        }
    }

    const handleFetchManagers = async () => {
        try {
            const { data } = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/events-manager/find-many-by-event/${event?.id}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'authorization': `Bearer ${session?.access_token}`
                }
            })

            if (data?.length) {
                setManagers(data)
            }
        } catch (error) {

        }
    }

    const handleDeleteManager = async (id: string) => {
        try {
            if (id === session?.user.uid) return
            const { data } = await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/events-manager/delete/${event?.id}/${id}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'authorization': `Bearer ${session?.access_token}`
                }
            })

            await handleFetchManagers()
        } catch (error) {

        }
    }

    const handleUpdateEventImage = async (photo: File) => {
        try {
            setLoadingPhoto(true)
            const storage = getStorage(firebase_app)
            const storageRef = refStorage(storage, `/photos/events/${session?.user?.email}`)
            await uploadBytes(storageRef, photo)

            const url = await getDownloadURL(storageRef)

            const { data } = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/event/update/${event!.id}`, {
                description: event?.description,
                name: event?.name,
                establishmentId: event?.establishmentId,
                photos: [url]
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'authorization': `Bearer ${session?.access_token}`
                }
            })

            const items = localStorage.getItem("@evets-letsgo")

            if (items) {
                const events = JSON.parse(items) as Event[]
                const index = events.findIndex(e => e.id === event?.id)

                events.splice(index, 1,
                    {
                        ...event!,
                        photos: [url]
                    })
                localStorage.removeItem("@evets-letsgo")
                localStorage.setItem("@evets-letsgo", JSON.stringify(events))
                setEvent(events[index])
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoadingPhoto(false)
        }
    }

    const renderCellTakers = useCallback((taker: any, columnKey: any) => {

        switch (columnKey) {
            case "manager":
                return (
                    <div className="flex flex-col">
                        <p className="text-bold text-sm capitalize">{taker?.email}</p>
                    </div>
                );
            case "roles":
                return (
                    <div className="flex truncate flex-col">
                        <p
                            className="truncate text-bold text-sm capitalize">
                            Conferente de ingressos
                        </p>

                    </div>

                );
            //  case "actions":
            // return (
            //     <div className="relative flex flex-row items-center gap-2">
            //         <Tooltip
            //             content="Excluir">
            //             <span className="text-lg text-default-400 cursor-pointer active:opacity-50">
            //                 <TrashIcon
            //                     className="w-6 h-6 text-danger"
            //                     onClick={() => {
            //                         handleDeleteManager(manager?.user?.uid)
            //                     }}
            //                 />
            //             </span>
            //         </Tooltip>
            //     </div>
            // );
            default:
                return undefined;
        }
    }, [event, session]);

    const renderCellManagers = useCallback((manager: any, columnKey: any) => {

        const getRecusosName = (recurso: string) => {
            switch (recurso) {
                case "CUPOMINSERT":
                    return "Inserir Cupons"
                case "CUPOMDELETE":
                    return "Deletar Cupons"
                case "CUPOMUPDATE":
                    return "Atualizar Cupons"
                case "EVENTUPDATE":
                    return "Atualizar evento"
                case "TICKETINSERT":
                    return "Inserir Tickets"
                case "TICKETUPDATE":
                    return "Atualizar Tickets"
                case "TICKETDELETE":
                    return "Deletar Tickets"
                case "CUPOMATTACH":
                    return "Vincular Cupons"
                default:
                    return "UNKNOW"
            }
        }

        switch (columnKey) {
            case "manager":
                return (
                    <User
                        name={manager?.user?.name}
                        description={manager?.user?.email}
                        avatarProps={{
                            src: manager?.user?.avatar
                        }}
                    />
                );
            case "roles":
                return (
                    <Tooltip
                        content={<div className="flex truncate flex-col">
                            {manager.eventManager?.recursos?.map((i: any, index: any) => (<p
                                key={index}
                                className="truncate text-bold text-sm capitalize">{getRecusosName(i)}
                            </p>))
                            }

                        </div>}>
                        <EyeIcon className="w-6 h-6 hover:cursor-pointer" />
                    </Tooltip>
                );
            case "actions":
                return (
                    <div className="relative flex flex-row items-center gap-2">
                        <Tooltip
                            content="Excluir">
                            <span className="text-lg text-default-400 cursor-pointer active:opacity-50">
                                <TrashIcon
                                    className="w-6 h-6 text-danger"
                                    onClick={() => {
                                        handleDeleteManager(manager?.user?.uid)
                                    }}
                                />
                            </span>
                        </Tooltip>
                    </div>
                );
            default:
                return undefined;
        }
    }, [event, session]);

    const renderCell = useCallback((ticket: any, columnKey: any) => {
        const cellValue = ticket[columnKey];

        switch (columnKey) {
            case "description":
                return (
                    <div className="flex flex-col">
                        <p className="text-bold text-sm capitalize">{ticket.description}</p>
                    </div>
                );
            case "price":
                return (
                    <div className="flex flex-col">
                        <p className="text-bold text-sm capitalize">{Number(ticket.price).toLocaleString("pt-br", { currency: "BRL", style: "currency" })}</p>
                    </div>
                );
            case "quantity_available":
                return (
                    <div className="flex flex-col">
                        <p className="text-bold text-sm capitalize">{ticket.quantity_available}</p>
                    </div>
                );
            case "cupons_count":
                return (
                    <div className="flex flex-col">
                        <p className="text-bold text-sm capitalize">{ticket?.cupons?.length}</p>
                    </div>
                );
            case "actions":
                return (
                    <div className="relative flex flex-row items-center gap-2">
                        <Tooltip
                            content="Editar">
                            <span className="text-lg text-default-400 cursor-pointer active:opacity-50">
                                <EditIcon
                                    onClick={() => {
                                        setTicketToUpdate(ticket)
                                        onOpenModalTicket()
                                    }}
                                />
                            </span>
                        </Tooltip>

                        <Tooltip content="Linkar cupons">
                            <span className="text-lg text-default-400 cursor-pointer active:opacity-50">
                                <LinkIcon
                                    onClick={() => {
                                        onOpenModalAttachCupom()
                                        setSelectedTicket(ticket)
                                    }}
                                    className="w-4 h-4" />
                            </span>
                        </Tooltip>
                    </div>
                );
            default:
                return cellValue;
        }
    }, []);

    const renderCellSales = useCallback((sale: any, columnKey: any) => {
        const cellValue = sale[columnKey];

        const getPaymentStatus = (status: string) => {
            switch (status) {
                case "PENDING":
                    return "Pendente"
                case "COMPLETED":
                    return "Concluído"
                default:
                    "Cancelado"
                    break;
            }
        }
        const totalAmount = () => {

            if (sale.CuponsAplicados?.length) {
                return sale.payment?.amount * (1 - Number(sale.CuponsAplicados[0].cupom?.descont_percent) / 100)
            }

            return sale.payment.amount as number
        }

        switch (columnKey) {
            case "amount":
                return (
                    <div className="flex flex-col">
                        <p className="text-bold text-sm capitalize">{Number(totalAmount()).toLocaleString("pt-br", { currency: "BRL", style: "currency" })}</p>
                    </div>
                );
            case "client":
                return (
                    <User
                        name={sale?.user?.name}
                        description={sale?.user?.email}
                        avatarProps={{
                            src: sale?.user?.avatar
                        }}
                    />
                );
            case "ticket":
                return (
                    <User
                        name={sale?.ticket?.description}
                        description={Number(sale?.ticket?.price).toLocaleString("pt-br", { currency: "BRL", style: "currency" })}
                    />
                );
            case "created_at":
                return (
                    <div className="flex flex-col">
                        <p className="text-bold text-sm capitalize">{moment(sale?.createdAt).format("DD/MM/YYYY [às] HH:mm:ss")}</p>
                    </div>
                );
            case "cupons_attach":
                return (
                    <>
                        {sale?.CuponsAplicados?.length ?
                            <Tooltip
                                content={<div>
                                    <span>O cliente aplicou este cupom, dando a ele <span className="font-bold">{sale.CuponsAplicados[0].cupom?.descont_percent}%</span> de desconto</span>
                                </div>}
                            >
                                <div className="flex flex-col">
                                    <p className="text-bold text-sm capitalize">{sale?.CuponsAplicados[0]?.cupom?.code}</p>
                                </div>
                            </Tooltip>
                            :
                            <div className="flex flex-col">
                                <p className="text-bold text-sm capitalize">Nenhum</p>
                            </div>

                        }
                    </>
                );
            case "status":
                return (
                    <div className="flex flex-col">
                        <p className="text-bold text-sm capitalize">{getPaymentStatus(sale.payment?.status)}</p>
                    </div>
                );

            default:
                return cellValue;
        }
    }, [])

    const columns = [
        { name: "DESCRIÇÃO", uid: "description" },
        { name: "PREÇO", uid: "price" },
        { name: "QUANTIDADE DISPONÍVEL", uid: "quantity_available" },
        { name: "CUPONS VINCULADOS", uid: "cupons_count" },
        { name: "ACTIONS", uid: "actions" },
    ];

    const columnsSales = [
        { name: "BILHETE", uid: "ticket" },
        { name: "CLIENTE", uid: "client" },
        { name: "DATA DA COMPRA", uid: "created_at" },
        { name: "CUPOM APLICADO", uid: "cupons_attach" },
        { name: "VALOR TOTAL", uid: "amount" },
        { name: "STATUS PAGAMENTO", uid: "status" }
    ];

    const columnsTaker = [
        { name: "USUÁRIO", uid: "manager" },
        { name: "FUNÇÕES", uid: "roles" }
    ];

    const columnsMangers = [
        { name: "USUÁRIO", uid: "manager" },
        { name: "FUNÇÕES", uid: "roles" },
        { name: "AÇÕES", uid: "actions" },
    ];

    const handleDownloadPdfSales = () => {
        const sales = tickets.flatMap(t => t.sales).filter(s => s.payment?.status === "COMPLETED")
        const definition = makeDocDefinition(sales)
        //@ts-ignore
        pdfMake.createPdf(definition, null, null, pdfFonts.pdfMake.vfs).download()
    }

    return (
        <main className="flex w-screen h-full overflow-auto flex-col items-center justify-start p-24 ">
            <section className="flex max-w-6xl w-full items-center flex-col gap-2">
                <div className="flex w-full justify-start">
                    <Breadcrumbs>
                        <BreadcrumbItem
                            href="/dashboard"
                        >Home</BreadcrumbItem>
                        <BreadcrumbItem
                            href="/dashboard/eventos"
                        >Eventos</BreadcrumbItem>
                        <BreadcrumbItem isCurrent>{event?.name}</BreadcrumbItem>
                    </Breadcrumbs>
                </div>
                <div className="bg-white rounded-lg w-full">
                    <div className="lg:flex lg:items-center lg:justify-between w-full bg-white p-6 rounded-lg">
                        <div className="min-w-0 flex-1">
                            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                                Evento {event?.name}
                            </h2>
                            <div className="mt-1 flex flex-col sm:mt-0 sm:flex-row sm:flex-wrap sm:space-x-6">
                                <div className="mt-2 flex items-center text-sm text-gray-500">
                                    <TagIcon className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" aria-hidden="true" />
                                    {event?.description}
                                </div>
                                <Tooltip
                                    placement="bottom-start"
                                    content={event?.establishment?.address}>
                                    <div className="mt-2 truncate max-w-xs flex cursor-pointer items-center text-sm text-gray-500">
                                        <MapPinIcon className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" aria-hidden="true" />
                                        {event?.establishment?.address}
                                    </div>
                                </Tooltip>
                                <div className="mt-2 flex items-center text-sm text-gray-500">
                                    <CalendarIcon className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" aria-hidden="true" />
                                    {moment(event?.dateTimestamp).format("LLL")}
                                </div>
                            </div>
                        </div>
                        <div className="mt-5 flex lg:ml-4 lg:mt-0">
                            <span className="hidden sm:block">
                                <button
                                    onClick={onOpenModalEditEvent}
                                    type="button"
                                    className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                                >
                                    <PencilIcon className="-ml-0.5 mr-1.5 h-5 w-5 text-gray-400" aria-hidden="true" />
                                    Editar
                                </button>
                            </span>

                            <Menu as="div" className="relative ml-3 sm:hidden">
                                <Menu.Button className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:ring-gray-400">
                                    More
                                    <ChevronDownIcon className="-mr-1 ml-1.5 h-5 w-5 text-gray-400" aria-hidden="true" />
                                </Menu.Button>

                                <Transition
                                    as={Fragment}
                                    enter="transition ease-out duration-200"
                                    enterFrom="transform opacity-0 scale-95"
                                    enterTo="transform opacity-100 scale-100"
                                    leave="transition ease-in duration-75"
                                    leaveFrom="transform opacity-100 scale-100"
                                    leaveTo="transform opacity-0 scale-95"
                                >
                                    <Menu.Items className="absolute right-0 z-10 -mr-1 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                        <Menu.Item>
                                            {({ active }) => (
                                                <a
                                                    href="#"
                                                    className={classNames(active ? 'bg-gray-100' : '', 'block px-4 py-2 text-sm text-gray-700')}
                                                >
                                                    Editar
                                                </a>
                                            )}
                                        </Menu.Item>
                                    </Menu.Items>
                                </Transition>
                            </Menu>
                        </div>
                    </div>
                    <div className="flex flex-row w-full items-center gap-10 bg-white p-6 rounded-lg">

                        <div className="flex flex-col gap-2 justify-center">
                            <Image
                                className="rounded-lg"
                                alt="Album cover"
                                height={250}
                                src={selectedPhoto ? previewImage : event ? event?.photos[0] : ""}
                                width={240}
                            />

                            <div className="flex flex-row items-center justify-center">
                                <label
                                    htmlFor="file-upload-notafiscal"
                                    className="text-center justify-center w-full flex items-center relative cursor-pointer rounded-md bg-[#FF6600] p-2 font-semibold text-white focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2"
                                >
                                    {loadingPhoto ? <Spinner /> : <span className="text-center">Alterar</span>

                                    }
                                    <input
                                        accept="image/*"
                                        id="file-upload-notafiscal"
                                        name="file-upload-notafiscal"
                                        onChange={e => {
                                            handleUpdateEventImage(e.target.files![0])
                                        }}
                                        type="file"
                                        className="sr-only" />
                                </label>
                            </div>
                        </div>
                        <div className="flex flex-row items-center gap-10">

                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 1, delay: 0 }}
                            >
                                <Card>
                                    <CardBody>
                                        <div className="flex flex-col items-center gap-4 py-6">
                                            <span>Bilhetes cadastrados</span>
                                            <motion.span className="font-bold text-3xl text-[#FF6600]">{ticketsValue}</motion.span>
                                        </div>
                                    </CardBody>
                                </Card>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 1, delay: 0.3 }}

                            >
                                <Card>
                                    <CardBody>
                                        <div className="flex flex-col items-center gap-4 py-6">
                                            <span>Vendas confirmadas</span>
                                            <motion.span className="font-bold text-3xl text-[#FF6600]">{confirmedSales}</motion.span>
                                        </div>
                                    </CardBody>
                                </Card>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 1, delay: 0.4 }}

                            >
                                <Card>
                                    <CardBody>
                                        <div className="flex flex-col items-center gap-4 py-6">
                                            <span>Vendas pendentes</span>
                                            <motion.span className="font-bold text-3xl text-[#FF6600]">{unConfirmedSales}</motion.span>
                                        </div>
                                    </CardBody>
                                </Card>
                            </motion.div>
                        </div>
                        
                    </div>
                </div>

                <section className="bg-white p-6 rounded-lg w-full">
                    <div className="lg:flex lg:items-center lg:justify-between w-ful">
                        <div className="min-w-0 flex-1">
                            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                                Vendas
                            </h2>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            {/* <Button
                                variant="ghost"
                                className="text-[#FF6600] font-bold w-[100%]"
                                endContent={<CloudArrowDownIcon className="w-6 h-6" />}
                            >
                                Nomes na lista
                            </Button> */}

                            <Button
                                onClick={handleDownloadPdfSales}
                                variant="ghost"
                                className="text-[#FF6600] font-bold w-[100%]"
                                endContent={<CloudArrowDownIcon className="w-6 h-6" />}
                            >
                                Relatório vendas
                            </Button>

                        </div>
                    </div>

                    <div className="flex w-full flex-row gap-4 bg-white mt-8 rounded-lg">
                        <Table aria-label="Example table with custom cells">
                            <TableHeader columns={columnsSales}>
                                {(column) => (
                                    <TableColumn key={column.uid} align={column.uid === "actions" ? "center" : "start"}>
                                        {column.name}
                                    </TableColumn>
                                )}
                            </TableHeader>
                            <TableBody items={tickets.flatMap(t => t.sales)}>
                                {(item) => (
                                    <TableRow key={item.id}>
                                        {(columnKey) => <TableCell>{renderCellSales(item, columnKey)}</TableCell>}
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </section>

                <div className="flex w-full flex-row gap-4">
                    <div className="bg-white flex flex-col w-full p-6 rounded-lg">
                        <div className="lg:flex lg:items-center lg:justify-between w-full">
                            <div className="min-w-0 flex-1">
                                <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                                    Bilhetes
                                </h2>
                            </div>
                            <div className="mt-5 flex gap-2 lg:ml-4 lg:mt-0">
                                <span className="hidden sm:block">
                                    <button
                                        onClick={onOpenChangeModalTicket}
                                        type="button"
                                        className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-[#FF6600] shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                                    >
                                        <PlusCircleIcon className="-ml-0.5 mr-1.5 h-5 w-5 text-[#FF6600]" aria-hidden="true" />
                                        Novo
                                    </button>
                                </span>
                            </div>
                        </div>
                        <div className="flex bg-white mt-8 rounded-lg">
                            <Table aria-label="Example table with custom cells">
                                <TableHeader columns={columns}>
                                    {(column) => (
                                        <TableColumn key={column.uid} align={column.uid === "actions" ? "center" : "start"}>
                                            {column.name}
                                        </TableColumn>
                                    )}
                                </TableHeader>
                                <TableBody items={tickets}>
                                    {(item) => (
                                        <TableRow key={item.id}>
                                            {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    <div className="bg-white flex flex-col w-full p-6 rounded-lg">
                        <div className="lg:flex lg:items-center lg:justify-between w-full">
                            <div className="min-w-0 flex-1">
                                <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                                    Cupons
                                </h2>
                            </div>
                            <div className="mt-5 flex gap-2 lg:ml-4 lg:mt-0">
                                <span className="hidden sm:block">
                                    <button
                                        onClick={onOpenChangeModalCupom}
                                        type="button"
                                        className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-[#FF6600] shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                                    >
                                        <PlusCircleIcon className="-ml-0.5 mr-1.5 h-5 w-5 text-[#FF6600]" aria-hidden="true" />
                                        Novo
                                    </button>
                                </span>
                            </div>
                        </div>

                        <div className="flex bg-white mt-8 rounded-lg">
                            {cupons.length ?
                                <Accordion
                                    isCompact
                                    variant="shadow">

                                    {
                                        cupons.map((item, index) => {
                                            return (
                                                <AccordionItem
                                                    startContent={<ReceiptPercentIcon className="w-6 h-6" />}
                                                    key={index}
                                                    title={item.code}
                                                    subtitle={`${item.descontPercent}% de desconto`}>
                                                </AccordionItem>
                                            )
                                        })
                                    }
                                </Accordion>
                                :
                                <div className="px-4 shadow-medium justify-center items-center flex rounded-medium bg-content1 w-full">
                                    <span>Não há dados</span>
                                </div>

                            }
                        </div>
                    </div>

                </div>

                <div className="flex w-full flex-row gap-4">

                    <div className="bg-white flex flex-col w-full p-6 rounded-lg">
                        <div className="lg:flex lg:items-center lg:justify-between w-full">
                            <div className="min-w-0 flex-1">
                                <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                                    Gestores
                                </h2>
                            </div>
                            <div className="mt-5 flex gap-2 lg:ml-4 lg:mt-0">
                                <span className="hidden sm:block">
                                    <button
                                        onClick={onOpenModalManager}
                                        type="button"
                                        className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-[#FF6600] shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                                    >
                                        <PlusCircleIcon className="-ml-0.5 mr-1.5 h-5 w-5 text-[#FF6600]" aria-hidden="true" />
                                        Novo
                                    </button>
                                </span>
                            </div>
                        </div>
                        <div className="flex w-full bg-white mt-8 rounded-lg">
                            <Table
                                aria-label="Example table with custom cells">
                                <TableHeader columns={columnsMangers}>
                                    {(column) => (
                                        <TableColumn key={column.uid} align={column.uid === "actions" ? "center" : "start"}>
                                            {column.name}
                                        </TableColumn>
                                    )}
                                </TableHeader>
                                <TableBody items={managers}>
                                    {(item) => (
                                        <TableRow key={item.eventManager?.id}>
                                            {(columnKey) => <TableCell>{renderCellManagers(item, columnKey)}</TableCell>}
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>

                        </div>
                    </div>

                    <div className="bg-white flex flex-col w-full  p-6 rounded-lg">
                        <div className="lg:flex lg:items-center lg:justify-between w-full">
                            <div className="min-w-0 flex-1">
                                <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                                    Conferentes
                                </h2>
                            </div>
                            <div className="mt-5 flex gap-2 lg:ml-4 lg:mt-0">
                                <span className="hidden sm:block">
                                    <button
                                        onClick={onOpenChangeModalTaker}
                                        type="button"
                                        className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-[#FF6600] shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                                    >
                                        <PlusCircleIcon className="-ml-0.5 mr-1.5 h-5 w-5 text-[#FF6600]" aria-hidden="true" />
                                        Novo
                                    </button>
                                </span>
                            </div>
                        </div>

                        <div className="flex bg-white mt-8 rounded-lg">
                            <Table aria-label="Example table with custom cells">
                                <TableHeader columns={columnsTaker}>
                                    {(column) => (
                                        <TableColumn key={column.uid} align={column.uid === "actions" ? "center" : "start"}>
                                            {column.name}
                                        </TableColumn>
                                    )}
                                </TableHeader>
                                <TableBody items={event?.ticketTakers.map(i => ({ email: i, id: i })) ?? []}>
                                    {(item) => (
                                        <TableRow key={item.id}>
                                            {(columnKey) => <TableCell>{renderCellTakers(item, columnKey)}</TableCell>}
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>

                        </div>
                    </div>

                </div>

            </section>

            <ModalFormTicket
                isOpen={isOpenModalTicket}
                onOpenChange={onOpenChangeModalTicket}
                callBack={fetchTickets}
                onClose={onCloseModalTicket}
                eventId={id}
                ticketToUpdate={ticketToUpdate}
            />

            <ModalFormCupom
                isOpen={isOpenModalCupom}
                onOpenChange={onOpenChangeModalCupom}
                callBack={fetchCupons}
                onClose={onCloseModalCupom}
                eventId={id}
            />

            <ModalAttachCupom
                isCallbackLoading={loading}
                isOpen={isOpenModalAttachCupom}
                onOpenChange={onOpenChangeModalAttachCupom}
                callBack={fetchTickets}
                cupons={cupons}
                tickets={tickets}
                ticket={selectedTicket}
                onClose={onCloseModalAttachCupom}
            />

            <ModalEditEvent
                isOpen={isOpenModalEditEvent}
                onOpenChange={onOpenChangeModalEditEvent}
                onClose={onCloseModalEditEvent}
                callback={fetchEvent}
                evento={event!}
            />

            <ModalNewManager
                isOpen={isOpenModalManager}
                onOpenChange={onOpenChangeModalManager}
                onClose={onCloseModalManager}
                callback={handleFetchManagers}
                evento={event!}
            />

            <ModalNewTaker
                isOpen={isOpenModalTaker}
                onOpenChange={onOpenChangeModalTaker}
                onClose={onCloseModalTaker}
                callback={fetchEvent}
                evento={event!}
            />
        </main>
    )
}