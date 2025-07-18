import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Token de autorização necessário' }, { status: 401 });
        }

        const token = authHeader.substring(7);
        const backendUrl = process.env.BACKEND_URL || 'http://localhost:3008';

        // Buscar eventos do usuário
        const eventsResponse = await fetch(`${backendUrl}/events/user/approved`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        // Buscar cupons do usuário
        const cuponsResponse = await fetch(`${backendUrl}/cupom/findAllByUser`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!eventsResponse.ok) {
            throw new Error(`Erro ao buscar eventos: ${eventsResponse.status}`);
        }

        if (!cuponsResponse.ok) {
            throw new Error(`Erro ao buscar cupons: ${cuponsResponse.status}`);
        }

        const eventsData = await eventsResponse.json();
        const cuponsData = await cuponsResponse.json();

        const events = eventsData.events || [];
        const cupons = cuponsData.cupons || [];
        
        const now = new Date();
        const activeEvents = events.filter((event: any) => 
            new Date(event.dateTimestamp) > now && event.is_active
        );
        const completedEvents = events.filter((event: any) => 
            new Date(event.dateTimestamp) < now
        );

        // Calcular receita total
        const totalRevenue = events.reduce((sum: number, event: any) => {
            const tickets = event.tickets || [];
            return sum + tickets.reduce((ticketSum: number, ticket: any) => {
                return ticketSum + (ticket.price * (ticket.quantity_available || 0));
            }, 0);
        }, 0);

        // Calcular tickets disponíveis
        const totalTickets = events.reduce((sum: number, event: any) => {
            const tickets = event.tickets || [];
            return sum + tickets.reduce((ticketSum: number, ticket: any) => {
                return ticketSum + (ticket.quantity_available || 0);
            }, 0);
        }, 0);

        const stats = {
            totalEvents: events.length,
            activeEvents: activeEvents.length,
            completedEvents: completedEvents.length,
            totalTickets,
            totalRevenue,
            totalCupons: cupons.length,
            success: true
        };
        
        return NextResponse.json(stats);

    } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
} 