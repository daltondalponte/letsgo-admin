import { Event } from "@/types/Letsgo";
import { Button, Checkbox, CheckboxGroup, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, ModalProps } from "@nextui-org/react";
import axios from "axios";
import { useAuth } from "@/context/authContext";
import { ChangeEvent, useEffect, useState } from "react";

const emailRegex = /^\S+@\S+\.\S+$/
const recursosList = [
    {
        label: 'Criar cupons',
        value: 'CUPOMINSERT'
    },
    {
        label: 'Vincular/Desvincular Cupons',
        value: 'CUPOMATTACH'
    },
    {
        label: 'Editar foto e descrição do evento',
        value: 'EVENTUPDATE'
    },
    {
        label: 'Editar tickets',
        value: 'TICKETUPDATE'
    },
]

interface Props extends Omit<ModalProps, "children"> {
    evento: Event;
    callback: () => void
}

export function ModalNewManager({ evento, onClose, callback, ...rest }: Props) {
    const { user, token } = useAuth();
    const [recursos, setRecursos] = useState<string[]>([])
    const [loading, setLoading] = useState(false)
    const [email, setEmail] = useState("")

    const handleSubmit = async () => {
        try {

            if (!recursos.length) return

            if (!emailRegex.test(email)) {
                alert("Email inválido.")
                return
            }
            setLoading(true)

            const { data } = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/events-manager/create`, {
                eventId: evento.id,
                recursos,
                email: email.toLowerCase().trim()
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'authorization': `Bearer ${token}`
                }
            })

            callback()

            if (onClose)
                onClose()

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false)
        }
    }

    return (
        <Modal
            backdrop="blur"
            hideCloseButton
            isDismissable={false}
            size="md"
            {...rest}
        >
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader className="flex flex-col gap-1">Novo gerente</ModalHeader>
                        <ModalBody>
                            <Input
                                label="Email"
                                value={email}
                                onChange={({ target: { value } }) => {
                                    setEmail(value)
                                }}
                                maxLength={99}
                                placeholder="example@email.com"
                            />

                            <CheckboxGroup
                                value={recursos}
                                onValueChange={setRecursos}
                                label="Selecione as permissões"
                            >
                                {
                                    recursosList.map((r, i) => <Checkbox value={r.value}>{r.label}</Checkbox>)
                                }
                            </CheckboxGroup>
                        </ModalBody>
                        <ModalFooter>
                            <Button
                                color="danger"
                                variant="light"
                                onPress={() => {
                                    onClose()
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