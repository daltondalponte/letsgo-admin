import React from "react";
import { Card, CardBody, Image, Button, CardFooter, Chip } from "@nextui-org/react";
import { Event } from "@/types/Letsgo";
import "moment/locale/pt-br"
import moment from "moment";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

interface Props {
    event: Event
}

export function CardEvent({ event }: Props) {
    // Função para obter a cor do status
    const getStatusColor = (status?: string) => {
        switch (status) {
            case "PENDING": return "warning";
            case "APPROVED": return "success";
            case "REJECTED": return "danger";
            default: return "default";
        }
    };

    // Função para obter o texto do status
    const getStatusText = (status?: string) => {
        switch (status) {
            case "PENDING": return "Aguardando Aprovação";
            case "APPROVED": return "Aprovado";
            case "REJECTED": return "Rejeitado";
            default: return "Ativo";
        }
    };

    return (
        <Card
            isBlurred
            className="border-none bg-background/60 dark:bg-default-100/50 w-full"
            shadow="sm"
        >
            <CardBody>
                <div className="grid grid-cols-6 md:grid-cols-12 gap-6 md:gap-4 items-center justify-center">
                    <div className="relative col-span-6 md:col-span-4">
                        <Image
                            alt="Album cover"
                            className="object-cover"
                            height={250}
                            shadow="md"
                            src={event?.photos[0]}
                            width="100%"
                        />
                    </div>

                    <div className="flex flex-col col-span-6 md:col-span-8">
                        <div className="flex justify-between items-start">
                            <div className="flex flex-col gap-0">
                                <div className="flex items-center gap-2 mb-2">
                                    <h3 className="font-semibold text-foreground/90">{event.name}</h3>
                                    {/* Status de aprovação */}
                                    {event.approvalStatus && (
                                        <Chip
                                            color={getStatusColor(event.approvalStatus) as any}
                                            variant="flat"
                                            size="sm"
                                        >
                                            {getStatusText(event.approvalStatus)}
                                        </Chip>
                                    )}
                                </div>
                                <p className="text-small text-foreground/80">{event.description}</p>
                                <h1 className="text-large font-medium mt-2">{moment(event.dateTimestamp).format("LLL")}</h1>
                                
                                {/* Informação adicional para eventos pendentes */}
                                {event.approvalStatus === "PENDING" && event.needsApproval && (
                                    <p className="text-sm text-yellow-600 mt-1">
                                        ⏳ Aguardando aprovação do proprietário do estabelecimento
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </CardBody>
            <CardFooter>
                <Button
                    variant="light"
                    as={Link}
                    href={`/dashboard/eventos/${event.id}`}
                    className="text-[#FF6600] font-bold"
                    endContent={<ChevronRightIcon className="w-5 h-5" />}>
                    Ir para página de gestão
                </Button>
            </CardFooter>
        </Card>
    );
}
