import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization');
    
    if (!token) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 });
    }

    console.log('🔍 Buscando estabelecimentos do backend...');
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3008';
    const response = await fetch(`${backendUrl}/establishments`, {
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json',
      },
    });

    console.log('📊 Status da resposta:', response.status);
    
    if (!response.ok) {
      console.error('❌ Erro do backend:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('❌ Erro detalhado:', errorText);
      return NextResponse.json(
        { error: 'Erro ao buscar estabelecimentos do backend' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('✅ Estabelecimentos recebidos:', data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('💥 Erro na rota de estabelecimentos:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 