import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const period = searchParams.get('period');
        const eventId = searchParams.get('eventId');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3008';
        
        // Construir URL com parâmetros
        const params = new URLSearchParams();
        if (period) params.append('period', period);
        if (eventId && eventId !== 'all') params.append('eventId', eventId);
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);

        const url = `${apiUrl}/events/user/approved?${params}`;

        const response = await fetch(url, {
            headers: {
                'authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Erro na resposta da API:', errorText);
            return NextResponse.json(
                { error: `Erro ao buscar resumo: ${response.status}` },
                { status: response.status }
            );
        }

        const data = await response.json();
        
        // Calcular resumo dos dados
        const events = data.events || [];
        let totalRevenue = 0;
        let totalSales = 0;
        let totalTickets = 0;
        let totalTicketPrice = 0;

        events.forEach((event: any) => {
            event.Ticket?.forEach((ticket: any) => {
                const sales = ticket.sales || 0;
                const price = ticket.price || 0;
                totalRevenue += sales * price;
                totalSales += sales;
                totalTickets += ticket.quantity_available || 0;
                totalTicketPrice += price;
            });
        });

        const avgTicketPrice = totalTickets > 0 ? totalTicketPrice / totalTickets : 0;

        return NextResponse.json({
            totalRevenue,
            totalSales,
            totalEvents: events.length,
            avgTicketPrice
        });

    } catch (error) {
        console.error('Erro ao buscar resumo:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
} 