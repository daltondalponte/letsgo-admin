import { LinkIcon, ReceiptPercentIcon } from "@heroicons/react/24/outline";
import { Accordion, AccordionItem, Button, Card, CardBody, CardFooter, CardHeader, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, ModalProps } from "@nextui-org/react";
import axios from "axios";
import { useSession } from "next-auth/react";
import { ChangeEvent, useEffect, useState } from "react";


interface Props extends Omit<ModalProps, "children"> {
    callBack: () => {};
    ticket: any;
    tickets: any[];
    cupons: any[];
    isCallbackLoading: boolean
}

export function ModalAttachCupom({ callBack, onClose, cupons, ticket, isCallbackLoading, tickets, ...rest }: Props) {
    const { data: session } = useSession()
    const [loading, setLoading] = useState(false)

    const attachTicket = async (item: any) => {
        try {
            setLoading(true)
            const url = `${process.env.NEXT_PUBLIC_API_URL}/cupom/attachTicket`

            const body = {
                cupomId: item.id,
                ticketId: ticket?.id,
                eventId: ticket?.eventId
            }

            const { data } = await axios.post(url, body, {
                headers: {
                    'Content-Type': 'application/json',
                    'authorization': `Bearer ${session?.access_token}`
                }
            })
            callBack()
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const dettachTicket = async (item: any) => {
        try {
            setLoading(true)
            const url = `${process.env.NEXT_PUBLIC_API_URL}/cupom/dettachTicket/${ticket?.eventId}?cupomId=${item?.id}&ticketId=${ticket?.id}`
            const { data } = await axios.delete(url, {
                headers: {
                    'Content-Type': 'application/json',
                    'authorization': `Bearer ${session?.access_token}`
                }
            })

            callBack()
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Modal
            backdrop="blur"
            hideCloseButton
            isDismissable={false}
            size="lg"
            {...rest}
        >
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader className="flex flex-col gap-1">Vincular cupons</ModalHeader>
                        <ModalBody>
                            {cupons.length ?

                                cupons.map((item, index) => {
                                    return (
                                        <Card>

                                            <CardBody

                                            >
                                                <div
                                                    className="flex flex-row items-center justify-between"
                                                >
                                                    <div
                                                        className="flex flex-row items-center"
                                                    >
                                                        <ReceiptPercentIcon className="w-6 h-6" />
                                                        <span>
                                                            {item.code}
                                                        </span>
                                                    </div>

                                                    {item?.descontPercent}% de desconto

                                                </div>
                                            </CardBody>
                                            <CardFooter>
                                                <Button
                                                    isLoading={loading || isCallbackLoading}
                                                    isDisabled={loading || isCallbackLoading}
                                                    onClick={() => {
                                                        ticket.cupons?.map((c: any) => c.code)?.includes(item.code) ?
                                                            dettachTicket(item) : attachTicket(item)
                                                    }}
                                                    startContent={<LinkIcon className="w-5 h-5 text-[#FF6600]" />}
                                                    variant="ghost"
                                                    className="text-[#FF6600]"
                                                >
                                                    {ticket.cupons?.map((c: any) => c.code)?.includes(item.code) ? "Desvincular" : "Vincular"}
                                                </Button>
                                            </CardFooter>
                                        </Card>
                                    )
                                })

                                :
                                <div className="px-4 shadow-medium justify-center items-center flex rounded-medium bg-content1 w-full">
                                    <span>Nenhum cupom foi encontrado para este evento</span>
                                </div>

                            }

                        </ModalBody>
                        <ModalFooter>
                            <Button
                                isDisabled={loading || isCallbackLoading}
                                color="danger"
                                variant="light"
                                onPress={() => {
                                    onClose()
                                }}>
                                Fechar
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    )
}