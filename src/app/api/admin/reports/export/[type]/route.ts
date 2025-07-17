import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { type: string } }
) {
  try {
    const token = request.headers.get('authorization');
    
    if (!token) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 });
    }

    const { type } = params;
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3008';
    const response = await fetch(`${backendUrl}/admin/reports/export/${type}`, {
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Erro do backend:', response.status, response.statusText);
      return NextResponse.json(
        { error: 'Erro ao exportar relatório do backend' },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Converter dados para CSV
    let csvContent = '';
    
    switch (type) {
      case 'general':
        csvContent = 'Métrica,Valor\n';
        csvContent += `Total de Usuários,${data.totalUsers}\n`;
        csvContent += `Total de Eventos,${data.totalEvents}\n`;
        csvContent += `Total de Tickets,${data.totalTickets}\n`;
        csvContent += `Eventos Ativos,${data.activeEvents}\n`;
        csvContent += `Eventos Concluídos,${data.completedEvents}\n`;
        break;
        
      case 'events':
        csvContent = 'Evento,Estabelecimento,Data,Vendas,Receita,Status\n';
        data.events?.forEach((event: any) => {
          csvContent += `"${event.name}","${event.establishment}","${event.date}",${event.totalSales},${event.totalRevenue},"${event.status}"\n`;
        });
        break;
        
      case 'users':
        csvContent = 'Nome,Email,Tipo,Ativo,Estabelecimento,Data de Criação\n';
        data.users?.forEach((user: any) => {
          csvContent += `"${user.name}","${user.email}","${user.type}","${user.isActive ? 'Sim' : 'Não'}","${user.establishment}","${user.createdAt}"\n`;
        });
        break;
        
      default:
        csvContent = 'Dados do relatório\n';
    }

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="relatorio-${type}-${new Date().toISOString().split('T')[0]}.csv"`
      }
    });
  } catch (error) {
    console.error('Erro na rota de exportação:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 