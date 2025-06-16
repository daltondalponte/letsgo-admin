import { Event } from "@/types/Letsgo";
import { Button, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, ModalProps } from "@nextui-org/react";
import axios from "axios";
import { useSession } from "next-auth/react";
import { ChangeEvent, useEffect, useState } from "react";


interface Props extends Omit<ModalProps, "children"> {
    evento: Event;
    callback: () => void
}

export function ModalEditEvent({ evento, onClose, callback, ...rest }: Props) {
    const { data: session } = useSession()
    const [loading, setLoading] = useState(false)
    const [form, setForm] = useState(
        {
            establishmentId: "",
            description: "",
            name: ""
        }
    )

    const handleSubmit = async () => {
        try {

            if (Object.values(form).some(e => !e?.length)) return

            setLoading(true)

            const { data } = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/event/update/${evento.id}`, form, {
                headers: {
                    'Content-Type': 'application/json',
                    'authorization': `Bearer ${session?.access_token}`
                }
            })

            setForm({
                establishmentId: "",
                description: "",
                name: ""
            })

            const items = localStorage.getItem("@evets-letsgo")

            if (items) {
                const events = JSON.parse(items) as Event[]
                const index = events.findIndex(e => e.id === evento.id)
                events.splice(index, 1, {
                    ...evento,
                    ...form
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

    useEffect(() => {
        setForm({
            establishmentId: evento?.establishmentId,
            name: evento?.name,
            description: evento?.description
        })
    }, [evento])

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
                        <ModalHeader className="flex flex-col gap-1">Editar evento</ModalHeader>
                        <ModalBody>
                            <Input
                                label="Nome"
                                value={form.name}
                                onChange={({ target: { value } }) => {
                                    setForm((prev: any) => ({
                                        ...prev,
                                        name: value
                                    }))
                                }}
                                maxLength={30}
                                placeholder=""
                            />

                            <Input
                                label="Descrição"
                                value={form.description}
                                onChange={({ target: { value } }) => {
                                    setForm((prev: any) => ({
                                        ...prev,
                                        description: value
                                    }))
                                }}
                                maxLength={99}
                                placeholder=""
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