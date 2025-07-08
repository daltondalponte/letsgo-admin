import { NextRequest, NextResponse } from 'next/server';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 });
        }

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3008';
        const url = `${apiUrl}/event/find-many-by-establishment-approved/${params.id}`;
        
        console.log('Fazendo requisição para:', url);
        console.log('Token:', token.substring(0, 20) + '...');

        const response = await fetch(url, {
            headers: {
                'authorization': `Bearer ${token}`
            }
        });

        console.log('Status da resposta:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Erro na resposta da API:', errorText);
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        const data = await response.json();
        console.log('Dados recebidos:', data);
        return NextResponse.json(data);
    } catch (error) {
        console.error('Erro ao buscar eventos aprovados por estabelecimento:', error);
        return NextResponse.json({ 
            error: 'Erro interno do servidor',
            details: error instanceof Error ? error.message : 'Erro desconhecido'
        }, { status: 500 });
    }
} 