"use client"
import { ChangeEvent, useCallback, useEffect, useMemo, useState, useTransition } from "react";

import { Accordion, AccordionItem, Avatar, BreadcrumbItem, Breadcrumbs, Button, Divider, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Pagination, Switch, useDisclosure } from "@nextui-org/react";
import { BanknotesIcon, MagnifyingGlassCircleIcon, PhotoIcon, PlusCircleIcon, TicketIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Event } from "@/types/Letsgo";
import { CardEvent } from "../CardEvent";
import axios from "axios";
import { useSession } from "next-auth/react";
import firebase_app from "@/lib/firebase";
import { getDownloadURL, getStorage, ref as refStorage, uploadBytes } from "firebase/storage";
import moment from "moment";
import { useRouter } from "next-nprogress-bar";
import "moment/locale/pt-br"
import { useAtom } from "jotai";

interface Props {
    events: Event[]
}

const rowsPerPage = 8
export function ListEvents({ events }: Props) {
    const { data: session } = useSession()

    const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
    const { isOpen: isOpenModalTicket, onOpen: onOpenModalTicket, onOpenChange: onOpenChangeModalTicket } = useDisclosure();

    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [selectedPhoto, setSelectedPhoto] = useState<File>()
    const [loading, setLoading] = useState(false)
    const [isTicketsSale, steIsTicketSale] = useState(false)
    const [page, setPage] = useState(1)
    const [filterValue, setFilterValue] = useState("");
    const hasSearchFilter = Boolean(filterValue);

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
    })

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
        if (!events) return []
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

    const handleOnChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        const keyName = name as keyof typeof eventForm

        setEventForm(prev => ({
            ...prev,
            [keyName]: value
        }))

    }

    const bottomContent = useMemo(() => {
        return (
            <div className="flex w-full justify-center items-center z-0">
                {items.length ? <Pagination
                    showControls
                    classNames={{
                        cursor: "bg-foreground text-background",
                    }}
                    color="default"
                    page={page}
                    total={pages}
                    variant="light"
                    onChange={setPage}
                /> : null}
            </div>
        );
    }, [filteredItems.length, page, pages, hasSearchFilter]);

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
                alert("Preencha todos os campos")
                return
            }

            const storage = getStorage(firebase_app)
            const storageRef = refStorage(storage, `/photos/events/${session?.user?.email}`)
            await uploadBytes(storageRef, selectedPhoto!)

            const url = await getDownloadURL(storageRef)

            startTransition(() => {
                // Refresh the current route and fetch new data from the server without
                // losing client-side browser or React state.
                router.refresh();
            });
            const dateTimestamp = moment(eventForm.dateTimestamp).toISOString()

            const formData = {
                ...eventForm,
                establishmentId: session?.user.establishment?.id,
                dateTimestamp,
                photos: [url],
                tickets: ticketsData
            }

            console.log(formData);

            await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/event/create`, formData, {
                headers: {
                    'authorization': `Bearer ${session?.access_token}`
                }
            })


            setTicketsData([])
            setEventForm({
                name: "",
                dateTimestamp: "",
                description: "",
            })

            alert("Seu evento foi criado com sucesso!")
            onClose()

        } catch (error) {
            console.error(error);
            alert("Ocorreu um erro")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        localStorage.removeItem("@evets-letsgo")
        localStorage.setItem("@evets-letsgo", JSON.stringify(events))
    }, [events])
    return (
        <section className="flex max-w-6xl w-full items-center flex-col gap-4">
            <div className="flex w-full justify-start">
                <Breadcrumbs>
                    <BreadcrumbItem
                        href="/"
                    >Home</BreadcrumbItem>
                    <BreadcrumbItem isCurrent>Eventos</BreadcrumbItem>
                </Breadcrumbs>
            </div>

            <div className="flex flex-row w-full justify-between items-center">
                <Input
                    isClearable
                    classNames={{
                        base: "w-full sm:max-w-[44%]",
                        inputWrapper: "border-1",
                    }}
                    placeholder="Buscar pelo nome ou descrição"
                    size="sm"
                    startContent={<MagnifyingGlassCircleIcon className="w-6 h-6 text-default-300" />}
                    value={filterValue}
                    variant="bordered"
                    onClear={() => setFilterValue("")}
                    onValueChange={onSearchChange} />

                <Button
                    onClick={onOpen}
                    className="bg-[#FF6600] text-white font-bold"
                    endContent={<PlusCircleIcon className="w-6  h-6" />}>
                    Novo
                </Button>
            </div>

            {!items.length ?
                <label className="flex text-black my-auto h-[200px] items-center self-center">
                    Nada encontrado...
                </label> : null
            }

            {items.map((item, index) => (
                <CardEvent key={index} event={item} />
            ))}
            {bottomContent}
            <Modal hideCloseButton isDismissable={false} size="4xl" isOpen={isOpen} onOpenChange={onOpenChange}>
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1">Novo evento</ModalHeader>
                            <ModalBody>
                                <div className="flex flex-row items-center gap-6">
                                    <Avatar
                                        src={previewImage}
                                        icon={<PhotoIcon className="w-15 h-15" />}
                                        className="w-20 h-20 text-large" />
                                    <label
                                        htmlFor="file-upload-notafiscal"
                                        className="text-center flex items-center relative cursor-pointer rounded-md bg-[#FF6600] p-2 font-semibold text-white focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2"
                                    >
                                        <span>{selectedPhoto ? "Alterar" : "Selecionar"}</span>
                                        <input
                                            accept="image/*"
                                            id="file-upload-notafiscal"
                                            name="file-upload-notafiscal"
                                            onChange={e => {
                                                setSelectedPhoto(e.target.files![0])
                                            }}
                                            type="file"
                                            className="sr-only" />
                                    </label>
                                </div>
                                <Input
                                    label="Nome"
                                    name="name"
                                    placeholder="Qual o nome do evento?"
                                    maxLength={99}
                                    value={eventForm.name}
                                    onChange={handleOnChange}
                                />
                                <Input
                                    label="Descrição"
                                    name="description"
                                    placeholder="Forneça uma descrição para o evento"
                                    maxLength={99}
                                    value={eventForm.description}
                                    onChange={handleOnChange}
                                />
                                <Input
                                    type="datetime-local"
                                    label=""
                                    name="dateTimestamp"
                                    value={eventForm.dateTimestamp}
                                    onChange={handleOnChange}
                                />
                                <Switch isSelected={isTicketsSale} onValueChange={steIsTicketSale}>
                                    Haverá venda de ingressos
                                </Switch>
                                {isTicketsSale ?
                                    <div className="flex flex-col transition transform -translate-y-1 motion-reduce:transition-none motion-reduce:transform-none">
                                        <Divider className="my-4" />

                                        <div className="flex flex-col py-6 max-h-[350px] overflow-auto">
                                            <Accordion variant="splitted">
                                                {ticketsData.map((item: typeof ticketForm, index) => {

                                                    return (
                                                        <AccordionItem
                                                            key={index}
                                                            isCompact
                                                            title={item.description}
                                                            subtitle={`Qtde ${item.quantity_available}`}
                                                            startContent={<TicketIcon className="w-6 h-6" />}
                                                        >
                                                            <div className="flex flex-row gap-4">
                                                                <BanknotesIcon className="w-5 h-5" />
                                                                <span className="text-[14px]">
                                                                    {Number(item.price).toLocaleString("pt-br", {
                                                                        currency: "BRL",
                                                                        style: "currency"
                                                                    })}
                                                                </span>
                                                            </div>
                                                            <Button
                                                                onClick={() => handleRemoveTicket(index)}
                                                                variant="light"
                                                                color="danger"
                                                                className="flex mx-auto self-end"
                                                                startContent={<TrashIcon className="w-5 h-5" />}>
                                                                Remover Ticket
                                                            </Button>
                                                        </AccordionItem>
                                                    )
                                                })}
                                            </Accordion>
                                        </div>
                                        <Button
                                            onClick={onOpenModalTicket}
                                            variant="light"
                                            className="text-[#FF6600] font-bold"
                                            endContent={<PlusCircleIcon className="w-6  h-6" />}>
                                            Adicionar Ticket
                                        </Button>

                                    </div>
                                    : null
                                }
                            </ModalBody>
                            <ModalFooter>
                                <Button
                                    isDisabled={loading}
                                    disabled={loading}
                                    color="danger"
                                    variant="light"
                                    onPress={onClose}>
                                    Fechar
                                </Button>
                                <Button
                                    isLoading={loading}
                                    isDisabled={loading}
                                    className="bg-[#FF6600] text-white font-bold"
                                    onPress={handleSubmit}>
                                    Enviar
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
        </section>
    )
}