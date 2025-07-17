import { NextRequest, NextResponse } from 'next/server';

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const token = request.headers.get('authorization');

    if (!token) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 });
    }

    const response = await fetch(`${apiUrl}/tickets/${params.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro ao atualizar ticket:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('authorization');

    if (!token) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 });
    }

    const url = `${apiUrl}/tickets/${params.id}`;
    console.log('Deletando ticket:', params.id);
    console.log('URL:', url);

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        Authorization: token,
      },
    });

    console.log('Status da resposta:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro na resposta da API:', errorText);
      return NextResponse.json({ error: errorText }, { status: response.status });
    }

    const data = await response.json();
    console.log('Ticket deletado com sucesso');
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro ao deletar ticket:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 