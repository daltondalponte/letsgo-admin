import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3008';
    const response = await fetch(`${backendUrl}/events/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': request.headers.get('authorization') || '',
      },
    });

    const result = await response.json();
    
    if (response.ok) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: response.status });
    }
  } catch (error) {
    console.error('Erro na exclusão do evento:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 