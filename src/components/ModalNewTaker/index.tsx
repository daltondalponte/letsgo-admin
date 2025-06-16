import { Event } from "@/types/Letsgo";
import { Button, Checkbox, CheckboxGroup, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, ModalProps } from "@nextui-org/react";
import axios from "axios";
import { useSession } from "next-auth/react";
import { ChangeEvent, useEffect, useState } from "react";

const emailRegex = /^\S+@\S+\.\S+$/

interface Props extends Omit<ModalProps, "children"> {
    evento: Event;
    callback: () => void
}

export function ModalNewTaker({ evento, onClose, callback, ...rest }: Props) {
    const { data: session } = useSession()
    const [loading, setLoading] = useState(false)
    const [email, setEmail] = useState("")

    const handleSubmit = async () => {
        try {

            if (!emailRegex.test(email)) {
                alert("Email inválido.")
                return
            }
            setLoading(true)

            const { data } = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/event/update-event-takers/${evento.id}`, {
                establishmentId: evento.establishmentId,
                ticketTakers: [...evento.ticketTakers, email]
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'authorization': `Bearer ${session?.access_token}`
                }
            })

            const items = localStorage.getItem("@evets-letsgo")

            if (items) {
                const events = JSON.parse(items) as Event[]
                const index = events.findIndex(e => e.id === evento.id)
                events.splice(index, 1, {
                    ...evento,
                    ticketTakers: [...evento.ticketTakers, email]
                })

                localStorage.removeItem("@evets-letsgo")
                localStorage.setItem("@evets-letsgo", JSON.stringify(events))
                callback()
            }

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
                        <ModalHeader className="flex flex-col gap-1">Novo conferente</ModalHeader>
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