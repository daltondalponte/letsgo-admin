import { NextRequest, NextResponse } from 'next/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('authorization');
    
    if (!token) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 });
    }

    const body = await request.json();
    const establishmentId = params.id;

    console.log('🔍 Atualizando estabelecimento:', establishmentId);
    console.log('📝 Dados recebidos:', body);

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3008';
    const response = await fetch(`${backendUrl}/establishments/admin/${establishmentId}`, {
      method: 'PUT',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    console.log('📊 Status da resposta:', response.status);
    
    if (!response.ok) {
      console.error('❌ Erro do backend:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('❌ Erro detalhado:', errorText);
      return NextResponse.json(
        { error: 'Erro ao atualizar estabelecimento no backend' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('✅ Estabelecimento atualizado com sucesso:', data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('💥 Erro na rota de atualização de estabelecimento:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 