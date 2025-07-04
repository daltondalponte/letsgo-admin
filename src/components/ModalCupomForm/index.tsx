import { Button, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, ModalProps } from "@nextui-org/react";
import axios from "axios";
import { useAuth } from "@/context/authContext";
import { ChangeEvent, useEffect, useState } from "react";


interface Props extends Omit<ModalProps, "children"> {
    callBack: () => {};
    eventId: string;
}

export function ModalFormCupom({ callBack, eventId, onClose, ...rest }: Props) {
    const { user, token } = useAuth()
    const [loading, setLoading] = useState(false)
    const [cupomForm, setCupomForm] = useState(
        {
            code: "",
            descont_percent: "",
            quantity_available: "",
            expiresAt: ""
        }
    )

    const handleSubmit = async () => {
        try {
            if (Object.values(cupomForm).some(v => !v.length)) {
                alert("Preencha todos os campos")
                return
            }

            setLoading(true)
            const formData = {
                code: cupomForm.code,
                descont_percent: Number(cupomForm.descont_percent),
                quantity_available: Number(cupomForm.quantity_available),
                eventId,
                expiresAt: new Date(cupomForm.expiresAt).toISOString()
            }

            const { data } = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/cupom/create`, formData, {
                headers: {
                    'Content-Type': 'application/json',
                    'authorization': `Bearer ${token}`
                }
            })

            setCupomForm({
                code: "",
                descont_percent: "",
                quantity_available: "",
                expiresAt: ""
            })
            callBack()
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
                        <ModalHeader className="flex flex-col gap-1">Novo cupom</ModalHeader>
                        <ModalBody>

                            <Input
                                label="Código do desconto"
                                value={cupomForm.code}
                                onChange={({ target: { value } }) => {
                                    setCupomForm(prev => ({
                                        ...prev,
                                        code: value
                                    }))
                                }}
                                maxLength={25}
                                placeholder="10OFF"
                            />

                            <Input
                                type="number"
                                label="Limite de uso"
                                value={cupomForm.quantity_available}
                                onChange={({ target: { value } }) => {
                                    setCupomForm(prev => ({
                                        ...prev,
                                        quantity_available: value
                                    }))
                                }}
                                placeholder="10"
                                max={500}
                            />

                            <Input
                                label="Porcentagem de desconto"
                                max={100}
                                placeholder="12.5"
                                labelPlacement="outside"
                                endContent={
                                    <div className="pointer-events-none flex items-center">
                                        <span className="text-default-400 text-small">%</span>
                                    </div>
                                }
                                value={cupomForm.descont_percent}
                                onChange={({ target: { value } }) => {
                                    setCupomForm(prev => ({
                                        ...prev,
                                        descont_percent: value
                                    }))
                                }}
                                type="number"
                            />

                            <label className=" pointer-events-none origin-top-left subpixel-antialiased block text-foreground-500 text-small">
                                Data de expiração
                            </label>
                            <Input
                                type="date"
                                label=""
                                name="dateTimestamp"
                                value={cupomForm.expiresAt}
                                onChange={({ target: { value } }) => {
                                    setCupomForm(prev => ({
                                        ...prev,
                                        expiresAt: value
                                    }))
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