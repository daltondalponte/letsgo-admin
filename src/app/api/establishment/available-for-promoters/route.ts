import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        // Buscar o token do header Authorization
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 });
        }

        const token = authHeader.substring(7);

        // Fazer requisição para a API backend
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3008'}/establishments/available-for-promoters`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Erro na API: ${response.status}`);
        }

        const data = await response.json();
        
        // Filtrar apenas estabelecimentos de owners (não de promoters)
        const establishments = data.establishments || data || [];
        
        return NextResponse.json({ establishments });
    } catch (error) {
        console.error('Erro ao buscar estabelecimentos:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
} 