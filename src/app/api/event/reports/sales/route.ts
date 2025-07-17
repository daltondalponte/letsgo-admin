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
                { error: `Erro ao buscar vendas: ${response.status}` },
                { status: response.status }
            );
        }

        const data = await response.json();
        
        // Transformar os dados para o formato esperado pelo frontend
        const events = data.events || [];
        const salesData = events.map((event: any) => ({
            date: event.dateTimestamp,
            sales: event.Ticket?.reduce((sum: number, ticket: any) => sum + (ticket.sales || 0), 0) || 0,
            revenue: event.Ticket?.reduce((sum: number, ticket: any) => sum + ((ticket.sales || 0) * (ticket.price || 0)), 0) || 0
        }));

        return NextResponse.json({ sales: salesData });

    } catch (error) {
        console.error('Erro ao buscar vendas:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
} 