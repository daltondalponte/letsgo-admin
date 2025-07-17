import { Button, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, ModalProps } from "@nextui-org/react";
import axios from "axios";
import { useAuth } from "@/context/authContext";
import { ChangeEvent, useEffect, useState } from "react";


interface Props extends Omit<ModalProps, "children"> {
    callBack?: () => void;
    ticketToUpdate?: any;
    eventId: string;
}

export function ModalFormTicket({ callBack, eventId, onClose, ticketToUpdate, ...rest }: Props) {
    const { user, token } = useAuth()
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
            const url = ticketToUpdate ? `/api/ticket/${ticketToUpdate.id}` : `/api/ticket`
            const formData: any = {
                eventId,
                price: Number(String(ticketForm.price).replace("R$", '').replaceAll('.', '').replace(',', '.')),
                quantity_available: Number(ticketForm.quantity_available)
            }

            if (!ticketToUpdate) formData.description = ticketForm.description
            if (ticketToUpdate) formData.id = ticketToUpdate.id
            
            const { data } = await axios[ticketToUpdate ? "put" : "post"](url, formData, {
                headers: {
                    'Content-Type': 'application/json',
                    'authorization': `Bearer ${token}`
                }
            })

            // Limpar formulário
            setTicketForm({
                description: "",
                price: "",
                quantity_available: ""
            })
            
            // Chamar callback apenas se fornecido
            if (callBack) {
                callBack()
            }
            
            // Fechar modal
            if (onClose) {
                onClose()
            }

        } catch (error) {
            console.error('Erro no handleSubmit:', error)
            alert('Erro ao salvar ingresso. Tente novamente.')
        } finally {
            setLoading(false)
        }
    }

    const handleClose = () => {
        // Limpar formulário ao fechar
        setTicketForm({
            description: "",
            price: "",
            quantity_available: ""
        });
        
        if (onClose) {
            try {
                onClose();
            } catch (e) {
                console.error('Erro ao fechar modal:', e);
            }
        }
    };

    useEffect(() => {
        // Preencher formulário quando ticketToUpdate mudar
        if (ticketToUpdate) {
            setTicketForm({
                description: ticketToUpdate.description,
                price: String(ticketToUpdate.price),
                quantity_available: String(ticketToUpdate.quantity_available)
            })
        } else {
            // Limpar formulário quando não há ticket para editar
            setTicketForm({
                description: "",
                price: "",
                quantity_available: ""
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
                        <ModalHeader className="flex flex-col gap-1">
                            {ticketToUpdate ? 'Editar Ingresso' : 'Novo Ingresso'}
                        </ModalHeader>
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
                                onPress={handleClose}>
                                Fechar
                            </Button>
                            <Button
                                isLoading={loading}
                                className="bg-[#FF6600] text-white font-bold"
                                onPress={handleSubmit}>
                                {loading ? 'Salvando...' : 'Salvar'}
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    )
}