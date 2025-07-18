import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Token de autorização necessário' }, { status: 401 });
        }

        const token = authHeader.substring(7);
        
        // Buscar cupons do usuário no backend
        const backendUrl = process.env.BACKEND_URL || 'http://localhost:3008';
        const response = await fetch(`${backendUrl}/cupom/findAllByUser`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Erro ao buscar cupons: ${response.status}`);
        }

        const data = await response.json();
        
        return NextResponse.json({
            cupons: data.cupons || [],
            success: true
        });

    } catch (error) {
        console.error('Erro ao buscar cupons:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
} 