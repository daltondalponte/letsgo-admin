import { NextRequest, NextResponse } from 'next/server';

export async function GET(
    request: NextRequest,
    { params }: { params: { type: string } }
) {
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
        const params2 = new URLSearchParams();
        if (period) params2.append('period', period);
        if (eventId && eventId !== 'all') params2.append('eventId', eventId);
        if (startDate) params2.append('startDate', startDate);
        if (endDate) params2.append('endDate', endDate);

        const url = `${apiUrl}/events/user/approved?${params2}`;

        const response = await fetch(url, {
            headers: {
                'authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Erro na resposta da API:', errorText);
            return NextResponse.json(
                { error: `Erro ao exportar relatório: ${response.status}` },
                { status: response.status }
            );
        }

        const data = await response.json();
        
        // Por enquanto, retornar um arquivo CSV simples
        // Em uma implementação real, você usaria uma biblioteca como xlsx ou csv-writer
        const events = data.events || [];
        let csvContent = 'Evento,Data,Vendas,Receita,Tickets Disponíveis\n';
        
        events.forEach((event: any) => {
            const totalSales = event.Ticket?.reduce((sum: number, ticket: any) => sum + (ticket.sales || 0), 0) || 0;
            const totalRevenue = event.Ticket?.reduce((sum: number, ticket: any) => sum + ((ticket.sales || 0) * (ticket.price || 0)), 0) || 0;
            const ticketsAvailable = event.Ticket?.reduce((sum: number, ticket: any) => sum + (ticket.quantity_available || 0), 0) || 0;
            
            csvContent += `"${event.name}","${event.dateTimestamp}",${totalSales},${totalRevenue},${ticketsAvailable}\n`;
        });

        return new NextResponse(csvContent, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="relatorio-${params.type}-${new Date().toISOString().split('T')[0]}.csv"`
            }
        });

    } catch (error) {
        console.error('Erro ao exportar relatório:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
} 