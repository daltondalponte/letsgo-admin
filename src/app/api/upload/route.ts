import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('📁 Endpoint de upload chamado - redirecionando para backend principal');
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string || 'events';
    
    if (!file) {
      console.error('❌ Nenhum arquivo fornecido');
      return NextResponse.json(
        { success: false, error: 'Nenhum arquivo fornecido' },
        { status: 400 }
      );
    }

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      console.error('❌ Tipo de arquivo inválido:', file.type);
      return NextResponse.json(
        { success: false, error: 'Apenas arquivos de imagem são permitidos' },
        { status: 400 }
      );
    }

    // Validar tamanho (10MB)
    if (file.size > 10 * 1024 * 1024) {
      console.error('❌ Arquivo muito grande:', file.size);
      return NextResponse.json(
        { success: false, error: 'Arquivo muito grande. Máximo 10MB' },
        { status: 400 }
      );
    }

    console.log('✅ Validações passaram, redirecionando para backend principal...');

    // Redirecionar para o backend principal
    const backendUrl = process.env.NEXT_PUBLIC_IMAGE_UPLOAD_URL || 'http://localhost:3008/api/upload';
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Upload bem-sucedido via backend principal:', result);
      return NextResponse.json(result);
    } else {
      console.error('❌ Erro no backend principal:', result);
      return NextResponse.json(result, { status: response.status });
    }
  } catch (error) {
    console.error('💥 Erro no endpoint de upload:', error);
    return NextResponse.json(
      { success: false, error: `Erro interno do servidor: ${error instanceof Error ? error.message : 'Erro desconhecido'}` },
      { status: 500 }
    );
  }
} 