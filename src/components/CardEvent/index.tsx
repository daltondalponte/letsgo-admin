import React from "react";
import { Card, CardBody, Image, Button, CardFooter } from "@nextui-org/react";
import { Event } from "@/types/Letsgo";
import "moment/locale/pt-br"
import moment from "moment";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
interface Props {
    event: Event
}
export function CardEvent({ event }: Props) {

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
                                <h3 className="font-semibold text-foreground/90">{event.name}</h3>
                                <p className="text-small text-foreground/80">{event.description}</p>
                                <h1 className="text-large font-medium mt-2">{moment(event.dateTimestamp).format("LLL")}</h1>
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
