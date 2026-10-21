import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../prisma/prisma.service.js';
import { PrismaProductsRepository } from './prisma-products.repository.js';

describe('PrismaProductsRepository', () => {
  const createMock = vi.fn();
  const findManyMock = vi.fn();
  const findUniqueMock = vi.fn();
  const updateMock = vi.fn();
  const deleteMock = vi.fn();

  const mockPrisma = {
    product: {
      create: createMock,
      findMany: findManyMock,
      findUnique: findUniqueMock,
      update: updateMock,
      delete: deleteMock,
    },
  } as unknown as PrismaService;

  const repository = new PrismaProductsRepository(mockPrisma);

  const sampleProduct = {
    id: 'prod-uuid-1',
    nome: 'Sensor A',
    categoria: 'Hardware',
    descricao: 'Desc',
    preco: 100,
    quantidade_estoque: 10,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('deve persistir um novo produto no prisma', async () => {
    createMock.mockResolvedValue(sampleProduct as any);

    const result = await repository.create({
      nome: 'Sensor A',
      categoria: 'Hardware',
      preco: 100,
      quantidade_estoque: 10,
    });

    expect(createMock).toHaveBeenCalled();
    expect(result).toEqual(sampleProduct);
  });

  it('deve listar produtos sem filtros', async () => {
    findManyMock.mockResolvedValue([sampleProduct as any]);

    const result = await repository.findAll();

    expect(findManyMock).toHaveBeenCalledWith({
      where: {},
      orderBy: { createdAt: 'desc' },
    });
    expect(result).toEqual([sampleProduct]);
  });

  it('deve listar produtos aplicando filtros de nome, categoria e preco', async () => {
    findManyMock.mockResolvedValue([sampleProduct as any]);

    await repository.findAll({
      nome: 'Sensor',
      categoria: 'Hardware',
      precoMin: 50,
      precoMax: 200,
    });

    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          nome: { contains: 'Sensor', mode: 'insensitive' },
          categoria: { contains: 'Hardware', mode: 'insensitive' },
        }),
      }),
    );
  });

  it('deve buscar produto por ID', async () => {
    findUniqueMock.mockResolvedValue(sampleProduct as any);

    const result = await repository.findById('prod-uuid-1');

    expect(findUniqueMock).toHaveBeenCalledWith({
      where: { id: 'prod-uuid-1' },
    });
    expect(result).toEqual(sampleProduct);
  });

  it('deve buscar múltiplos produtos por lista de IDs', async () => {
    findManyMock.mockResolvedValue([sampleProduct as any]);

    const result = await repository.findByIds(['prod-uuid-1']);

    expect(findManyMock).toHaveBeenCalledWith({
      where: { id: { in: ['prod-uuid-1'] } },
    });
    expect(result).toEqual([sampleProduct]);
  });

  it('deve atualizar campos parciais de um produto', async () => {
    updateMock.mockResolvedValue(sampleProduct as any);

    await repository.update('prod-uuid-1', {
      nome: 'Novo Nome',
      categoria: 'Nova Cat',
      descricao: 'Nova Desc',
      preco: 150,
      quantidade_estoque: 20,
    });

    expect(updateMock).toHaveBeenCalled();
  });

  it('deve excluir produto por ID', async () => {
    deleteMock.mockResolvedValue(sampleProduct as any);

    const result = await repository.delete('prod-uuid-1');

    expect(deleteMock).toHaveBeenCalledWith({
      where: { id: 'prod-uuid-1' },
    });
    expect(result).toEqual(sampleProduct);
  });
});
