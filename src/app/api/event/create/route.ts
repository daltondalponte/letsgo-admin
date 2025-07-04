import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        // Buscar o token do header ou dos cookies do NextAuth
        let token = request.headers.get('authorization');
        console.log('TOKEN RECEBIDO NA API ROUTE:', token);
        if (!token) {
            return NextResponse.json({ error: 'Token não informado' }, { status: 401 });
        }
        token = token || '';
        const apiUrl = 'http://localhost:3008/event/create';
        const res = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token.replace('Bearer ', '')}` } : {})
            },
            body: JSON.stringify(body)
        });
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (error) {
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
} 