"use client"

import { Card, CardHeader, CardBody, CardFooter, Divider, Link, Image, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, getKeyValue } from "@nextui-org/react";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/authContext";

interface UserData {
    user: {
        uid: string;
        name: string;
        email: string;
        type: string;
    };
    establishment?: {
        id: string;
        name: string;
        address: string;
        coordinates: any;
    };
    stats?: {
        totalEvents: number;
        totalTicketsSold: number;
        activeEvents: number;
    };
}

interface EventData {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    tickets: any[];
    user: { name: string };
    establishment: { name: string };
}

interface TicketData {
    id: string;
    description: string;
    price: number;
    eventId: string;
    event: { name: string };
    TicketSale: any[];
}

export default function MasterDashboard() {
    const { user, token } = useAuth();
    const [users, setUsers] = useState<UserData[]>([]);
    const [events, setEvents] = useState<EventData[]>([]);
    const [tickets, setTickets] = useState<TicketData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            if (user.type !== "MASTER") {
                setError("Acesso não autorizado.");
                setLoading(false);
                return;
            }

            try {
                const headers = {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                };

                // Fetch Users
                const usersRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users`, { headers });
                if (!usersRes.ok) throw new Error(`Erro ao buscar usuários: ${usersRes.statusText}`);
                const usersData = await usersRes.json();
                setUsers(usersData.users);

                // Fetch Events
                const eventsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/events`, { headers });
                if (!eventsRes.ok) throw new Error(`Erro ao buscar eventos: ${eventsRes.statusText}`);
                const eventsData = await eventsRes.json();
                setEvents(eventsData.events);

                // Fetch Tickets
                const ticketsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/tickets`, { headers });
                if (!ticketsRes.ok) throw new Error(`Erro ao buscar tickets: ${ticketsRes.statusText}`);
                const ticketsData = await ticketsRes.json();
                setTickets(ticketsData.tickets);

            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        if (user) {
            fetchData();
        }
    }, [user, token]);

    if (loading) return <div className="text-center">Carregando dados da Dashboard Master...</div>;
    if (error) return <div className="text-center text-red-500">Erro: {error}</div>;

    const totalUsers = users.length;
    const usersByType = users.reduce((acc, user) => {
        acc[user.user.type] = (acc[user.user.type] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const totalEvents = events.length;
    const totalTicketsSold = tickets.reduce((sum, ticket) => sum + ticket.TicketSale.length, 0);

    const ticketsSoldByProfessional = users.filter(u => u.user.type === "PROFESSIONAL").map(professional => {
        const professionalEvents = events.filter(event => event.user.name === professional.user.name || event.establishment.name === professional.establishment?.name);
        const professionalTicketsSold = professionalEvents.reduce((sum, event) => {
            const eventTickets = tickets.filter(ticket => ticket.eventId === event.id);
            return sum + eventTickets.reduce((s, t) => s + t.TicketSale.length, 0);
        }, 0);
        return {
            name: professional.user.name,
            totalTicketsSold: professionalTicketsSold
        };
    });

    return (
        <div className="p-4">
            <h1 className="text-3xl font-bold mb-6">Dashboard Master</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <Card className="py-4">
                    <CardHeader className="pb-0 pt-2 px-4 flex-col items-start">
                        <p className="text-tiny uppercase font-bold">Total de Usuários</p>
                        <small className="text-default-500">No sistema</small>
                        <h4 className="font-bold text-large">{totalUsers}</h4>
                    </CardHeader>
                </Card>

                <Card className="py-4">
                    <CardHeader className="pb-0 pt-2 px-4 flex-col items-start">
                        <p className="text-tiny uppercase font-bold">Usuários por Tipo</p>
                        <small className="text-default-500">Detalhes</small>
                        <h4 className="font-bold text-large">
                            {Object.entries(usersByType).map(([type, count]) => (
                                <div key={type}>{type}: {count}</div>
                            ))}
                        </h4>
                    </CardHeader>
                </Card>

                <Card className="py-4">
                    <CardHeader className="pb-0 pt-2 px-4 flex-col items-start">
                        <p className="text-tiny uppercase font-bold">Total de Eventos</p>
                        <small className="text-default-500">Cadastrados</small>
                        <h4 className="font-bold text-large">{totalEvents}</h4>
                    </CardHeader>
                </Card>

                <Card className="py-4">
                    <CardHeader className="pb-0 pt-2 px-4 flex-col items-start">
                        <p className="text-tiny uppercase font-bold">Total de Tickets Vendidos</p>
                        <small className="text-default-500">Em todos os eventos</small>
                        <h4 className="font-bold text-large">{totalTicketsSold}</h4>
                    </CardHeader>
                </Card>
            </div>

            <h2 className="text-2xl font-bold mb-4">Tickets Vendidos por Usuário Jurídico</h2>
            <Table aria-label="Tickets vendidos por usuário jurídico">
                <TableHeader>
                    <TableColumn key="name">Nome do Usuário Jurídico</TableColumn>
                    <TableColumn key="totalTicketsSold">Total de Tickets Vendidos</TableColumn>
                </TableHeader>
                <TableBody items={ticketsSoldByProfessional}>
                    {(item) => (
                        <TableRow key={item.name}>
                            {(columnKey) => <TableCell>{getKeyValue(item, columnKey)}</TableCell>}
                        </TableRow>
                    )}
                </TableBody>
            </Table>

            <h2 className="text-2xl font-bold mt-8 mb-4">Detalhes dos Usuários</h2>
            <Table aria-label="Detalhes dos usuários">
                <TableHeader>
                    <TableColumn key="user.name">Nome</TableColumn>
                    <TableColumn key="user.email">Email</TableColumn>
                    <TableColumn key="user.type">Tipo</TableColumn>
                    <TableColumn key="stats.totalEvents">Eventos</TableColumn>
                    <TableColumn key="stats.totalTicketsSold">Tickets Vendidos</TableColumn>
                </TableHeader>
                <TableBody items={users}>
                    {(item) => (
                        <TableRow key={item.user.uid}>
                            {(columnKey) => <TableCell>{getKeyValue(item, columnKey)}</TableCell>}
                        </TableRow>
                    )}
                </TableBody>
            </Table>

            <h2 className="text-2xl font-bold mt-8 mb-4">Detalhes dos Eventos</h2>
            <Table aria-label="Detalhes dos eventos">
                <TableHeader>
                    <TableColumn key="name">Nome do Evento</TableColumn>
                    <TableColumn key="startDate">Início</TableColumn>
                    <TableColumn key="endDate">Fim</TableColumn>
                    <TableColumn key="user.name">Criador</TableColumn>
                    <TableColumn key="establishment.name">Estabelecimento</TableColumn>
                </TableHeader>
                <TableBody items={events}>
                    {(item) => (
                        <TableRow key={item.id}>
                            {(columnKey) => <TableCell>{getKeyValue(item, columnKey)}</TableCell>}
                        </TableRow>
                    )}
                </TableBody>
            </Table>

            <h2 className="text-2xl font-bold mt-8 mb-4">Detalhes dos Tickets</h2>
            <Table aria-label="Detalhes dos tickets">
                <TableHeader>
                    <TableColumn key="description">Descrição</TableColumn>
                    <TableColumn key="price">Preço</TableColumn>
                    <TableColumn key="event.name">Evento</TableColumn>
                    <TableColumn key="TicketSale.length">Vendas</TableColumn>
                </TableHeader>
                <TableBody items={tickets}>
                    {(item) => (
                        <TableRow key={item.id}>
                            {(columnKey) => <TableCell>{getKeyValue(item, columnKey)}</TableCell>}
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
