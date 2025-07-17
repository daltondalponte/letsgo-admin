import { Event } from "@/types/Letsgo";
import { Button, Checkbox, CheckboxGroup, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, ModalProps } from "@nextui-org/react";
import axios from "axios";
import { useAuth } from "@/context/authContext";
import { ChangeEvent, useEffect, useState } from "react";

const emailRegex = /^\S+@\S+\.\S+$/

interface Props extends Omit<ModalProps, "children"> {
    evento: Event;
    callback: () => void
}

export function ModalNewTaker({ evento, onClose, callback, ...rest }: Props) {
    const { user, token } = useAuth();
    const [loading, setLoading] = useState(false)
    const [email, setEmail] = useState("")

    const handleSubmit = async () => {
        try {
            if (!emailRegex.test(email)) {
                alert("Email inválido.")
                return
            }
            setLoading(true)

            // Aqui, garantir que o endpoint e a lógica estejam corretos para recepcionista
            const { data } = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/event-managers`, {
                eventId: evento.id,
                userUid: email.toLowerCase().trim()
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
                        <ModalHeader className="flex flex-col gap-1">Novo Recepcionista</ModalHeader>
                        <ModalBody>
                            <Input
                                label="Email do Recepcionista"
                                value={email}
                                onChange={({ target: { value } }) => {
                                    setEmail(value)
                                }}
                                maxLength={99}
                                placeholder="example@email.com"
                            />
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