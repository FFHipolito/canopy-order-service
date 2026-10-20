import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed de dados industriais e florestais...');

  // Limpeza de tabelas para idempotencia
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();

  const productsData = [
    {
      nome: 'Válvula de Controle de Fluxo Hidráulica Rexroth 4WRZ',
      categoria: 'Hidráulica Industrial',
      descricao: 'Válvula direcional proporcional de alta vazão para automação de prensas de celulose e corte florestal.',
      preco: 8450.0,
      quantidade_estoque: 15,
    },
    {
      nome: 'Sensor IoT de Umidade e Condutividade do Solo LoRaWAN',
      categoria: 'IoT Florestal',
      descricao: 'Sonda multiparâmetros para telemetria em tempo real de talhões de eucalipto com alcance de até 15km.',
      preco: 1290.5,
      quantidade_estoque: 80,
    },
    {
      nome: 'Mudas Clonadas de Eucalipto Grancam B2 (Lote com 1000 mudas)',
      categoria: 'Silvicultura',
      descricao: 'Clones de alta produtividade volumétrica e tolerância hídrica selecionados para rotação florestal rápida.',
      preco: 950.0,
      quantidade_estoque: 200,
    },
    {
      nome: 'Drone Agrícola LiDAR Matrice 350 RTK para Inventário',
      categoria: 'Agrimensura e Sensoriamento',
      descricao: 'Plataforma aérea para escaneamento a laser 3D de dossel e cálculo volumétrico de biomassa florestal.',
      preco: 45000.0,
      quantidade_estoque: 4,
    },
    {
      nome: 'Cabeçote Harvester Komatsu 370E para Corte Florestal',
      categoria: 'Máquinas Pesadas',
      descricao: 'Cabeçote de alto rendimento para abate, desgalhe e traçamento de toras de diâmetro até 700mm.',
      preco: 185000.0,
      quantidade_estoque: 2,
    },
    {
      nome: 'Sistema Telemétrico de Detecção Precoce de Incêndios Florestais',
      categoria: 'Segurança Florestal',
      descricao: 'Câmera térmica rotativa 360 graus com algoritmo embarcado de IA e alcance de detecção de até 20km.',
      preco: 32000.0,
      quantidade_estoque: 8,
    },
  ];

  console.log(`Cadastrando ${productsData.length} produtos de alta precisão industrial...`);

  for (const item of productsData) {
    const created = await prisma.product.create({
      data: item,
    });
    console.log(`✔ [${created.categoria}] ${created.nome} - R$ ${created.preco} (Estoque: ${created.quantidade_estoque})`);
  }

  console.log('Seed industrial e florestal finalizado com sucesso!');
}

main()
  .catch((e) => {
    console.error('Erro durante a execução do seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });