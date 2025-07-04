import { NextRequest, NextResponse } from 'next/server';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Aqui deve buscar eventos reais do banco de dados pelo promoterId
        // Exemplo:
        // const events = await prisma.event.findMany({ where: { useruid: params.id } });
        const events = [];
        return NextResponse.json({ events });
    } catch (error) {
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
} 