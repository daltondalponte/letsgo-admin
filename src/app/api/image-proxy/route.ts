import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get('file');
    
    if (!fileName) {
      return NextResponse.json({ error: 'Parâmetro file é obrigatório' }, { status: 400 });
    }

    console.log('📁 Buscando imagem via backend principal:', fileName);

    // Redirecionar para o backend principal
    const backendUrl = process.env.NEXT_PUBLIC_IMAGE_PROXY_URL || 'http://localhost:3008/api/image-proxy';
    const proxyUrl = `${backendUrl}?file=${encodeURIComponent(fileName)}`;
    
    const response = await fetch(proxyUrl);
    
    if (!response.ok) {
      console.error('❌ Erro ao buscar imagem no backend principal:', response.status);
      return NextResponse.json({ error: 'Imagem não encontrada' }, { status: response.status });
    }

    // Obter o buffer da imagem
    const buffer = await response.arrayBuffer();
    
    // Obter o tipo de conteúdo do header da resposta
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    console.log('✅ Imagem encontrada via backend principal');

    // Retornar a imagem com os headers corretos
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000', // Cache por 1 ano
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    console.error('💥 Erro ao buscar imagem:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 