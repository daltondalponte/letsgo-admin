const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function listAndDeleteCupons() {
  try {
    console.log('🔍 Listando todos os cupons...\n');
    
    const cupons = await prisma.cupom.findMany({
      include: {
        event: {
          select: {
            id: true,
            name: true,
            useruid: true
          }
        }
      }
    });

    console.log(`📊 Total de cupons encontrados: ${cupons.length}\n`);

    cupons.forEach((cupom, index) => {
      console.log(`${index + 1}. Cupom ID: ${cupom.id}`);
      console.log(`   Código: ${cupom.code}`);
      console.log(`   Evento: ${cupom.event?.name || 'GLOBAL'}`);
      console.log(`   Event ID: ${cupom.eventId || 'N/A'}`);
      console.log(`   User UID: ${cupom.useruid}`);
      console.log(`   Quantidade: ${cupom.quantity_available}`);
      console.log(`   Expira em: ${cupom.expires_at}`);
      console.log(`   Criado em: ${cupom.createdAt}`);
      console.log('---');
    });

    // Perguntar qual cupom deletar
    console.log('\n💡 Para deletar um cupom, use o comando:');
    console.log('node scripts/delete-cupom.js <ID_DO_CUPOM>');
    
  } catch (error) {
    console.error('❌ Erro ao listar cupons:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function deleteCupom(cupomId) {
  try {
    console.log(`🗑️ Tentando deletar cupom ID: ${cupomId}`);
    
    const cupom = await prisma.cupom.findUnique({
      where: { id: cupomId },
      include: {
        event: {
          select: {
            name: true
          }
        }
      }
    });

    if (!cupom) {
      console.log('❌ Cupom não encontrado');
      return;
    }

    console.log(`📋 Detalhes do cupom:`);
    console.log(`   Código: ${cupom.code}`);
    console.log(`   Evento: ${cupom.event?.name || 'GLOBAL'}`);
    console.log(`   User UID: ${cupom.useruid}`);

    // Deletar o cupom
    await prisma.cupom.delete({
      where: { id: cupomId }
    });

    console.log('✅ Cupom deletado com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao deletar cupom:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar baseado nos argumentos
const args = process.argv.slice(2);

if (args.length > 0) {
  const cupomId = args[0];
  deleteCupom(cupomId);
} else {
  listAndDeleteCupons();
} 