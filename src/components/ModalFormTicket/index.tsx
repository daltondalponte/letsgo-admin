import { Button, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, ModalProps } from "@nextui-org/react";
import axios from "axios";
import { useSession } from "next-auth/react";
import { ChangeEvent, useEffect, useState } from "react";


interface Props extends Omit<ModalProps, "children"> {
    callBack: () => {};
    ticketToUpdate?: any;
    eventId: string;
}

export function ModalFormTicket({ callBack, eventId, onClose, ticketToUpdate, ...rest }: Props) {
    const { data: session } = useSession()
    const [loading, setLoading] = useState(false)
    const [ticketForm, setTicketForm] = useState(
        {
            description: "",
            price: "",
            quantity_available: ""
        }
    )

    const moneyMask = (value: string) => {
        let v = value.replace('.', '').replace(',', '').replace(/\D/g, '')

        const options = { minimumFractionDigits: 2 }
        const result = new Intl.NumberFormat('pt-BR', options).format(
            parseFloat(v) / 100
        )

        setTicketForm(prev => ({ ...prev, price: result }))

        return result
    }

    const handleSubmit = async () => {
        try {
            if (Object.values(ticketForm).some(v => !v.length)) {
                alert("Preencha todos os campos")
                return
            }

            setLoading(true)
            const url = ticketToUpdate ? `${process.env.NEXT_PUBLIC_API_URL}/ticket/update/${ticketToUpdate?.id}` : `${process.env.NEXT_PUBLIC_API_URL}/ticket/create`
            const formData: any = {
                eventId,
                price: Number(String(ticketForm.price).replace("R$", '').replaceAll('.', '').replace(',', '.')),
                quantity_available: Number(ticketForm.quantity_available)
            }

            if (!ticketToUpdate) formData.description = ticketForm.description
            
            const { data } = await axios[ticketToUpdate ? "put" : "post"](url, formData, {
                headers: {
                    'Content-Type': 'application/json',
                    'authorization': `Bearer ${session?.access_token}`
                }
            })

            setTicketForm({
                description: "",
                price: "",
                quantity_available: ""
            })
            callBack()
            if (onClose)
                onClose()

        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {

        if (ticketToUpdate) {
            setTicketForm({
                description: ticketToUpdate.description,
                price: String(ticketToUpdate.price),
                quantity_available: String(ticketToUpdate.quantity_available)
            })
        }
    }, [ticketToUpdate])

    return (
        <Modal
            backdrop="blur"
            hideCloseButton
            isDismissable={false}
            size="4xl"
            {...rest}
        >
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader className="flex flex-col gap-1">Novo ticket</ModalHeader>
                        <ModalBody>

                            <Input
                                label="Descrição do ingresso"
                                isDisabled={!!ticketToUpdate}
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
                                onChange={({ target: { value } }) => {
                                    moneyMask(value)
                                }}
                            />
                        </ModalBody>
                        <ModalFooter>
                            <Button
                                color="danger"
                                variant="light"
                                onPress={() => {
                                    onClose()
                                    callBack()
                                }}>
                                Fechar
                            </Button>
                            <Button
                                isLoading={loading}
                                className="bg-[#FF6600] text-white font-bold"
                                onPress={handleSubmit}>
                                Salvar
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    )
}