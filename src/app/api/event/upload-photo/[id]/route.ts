import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3008';
    const response = await fetch(`${backendUrl}/event/upload-photo/${id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('authorization') || '',
      },
      body: JSON.stringify(body),
    });

    const result = await response.json();
    
    if (response.ok) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: response.status });
    }
  } catch (error) {
    console.error('Erro no upload de foto:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 