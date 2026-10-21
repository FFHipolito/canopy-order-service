import { describe, expect, it, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import type { PrismaService } from '../../prisma/prisma.service.js';
import { PrismaOrdersRepository } from './prisma-orders.repository.js';

describe('PrismaOrdersRepository', () => {
  const createMockPrisma = () => {
    const findUniqueProductMock = vi.fn();
    const updateProductMock = vi.fn();
    const createOrderMock = vi.fn();
    const updateOrderMock = vi.fn();
    const findManyOrdersMock = vi.fn();
    const findUniqueOrderMock = vi.fn();

    const mockTx = {
      product: {
        findUnique: findUniqueProductMock,
        update: updateProductMock,
      },
      order: {
        create: createOrderMock,
        update: updateOrderMock,
      },
    };

    const mockPrisma = {
      order: {
        findMany: findManyOrdersMock,
        findUnique: findUniqueOrderMock,
      },
      $transaction: vi.fn(async (cb: (tx: any) => Promise<any>) => cb(mockTx)),
    } as unknown as PrismaService;

    return {
      mockPrisma,
      findUniqueProductMock,
      updateProductMock,
      createOrderMock,
      updateOrderMock,
      findManyOrdersMock,
      findUniqueOrderMock,
    };
  };

  const sampleOrderWithRelations = {
    id: 'order-1',
    total_pedido: new Prisma.Decimal(100),
    status: OrderStatus.PENDENTE,
    produtos: [
      {
        id: 'item-1',
        orderId: 'order-1',
        productId: 'prod-1',
        quantidade: 2,
        precoUnitario: new Prisma.Decimal(50),
        createdAt: new Date(),
        product: {
          id: 'prod-1',
          nome: 'Produto A',
          quantidade_estoque: 10,
        },
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('deve listar todos os pedidos', async () => {
    const { mockPrisma, findManyOrdersMock } = createMockPrisma();
    findManyOrdersMock.mockResolvedValue([sampleOrderWithRelations as any]);
    const repository = new PrismaOrdersRepository(mockPrisma);

    const result = await repository.findAll();

    expect(findManyOrdersMock).toHaveBeenCalled();
    expect(result).toEqual([sampleOrderWithRelations]);
  });

  it('deve buscar pedido por ID', async () => {
    const { mockPrisma, findUniqueOrderMock } = createMockPrisma();
    findUniqueOrderMock.mockResolvedValue(sampleOrderWithRelations as any);
    const repository = new PrismaOrdersRepository(mockPrisma);

    const result = await repository.findById('order-1');

    expect(findUniqueOrderMock).toHaveBeenCalledWith({
      where: { id: 'order-1' },
      include: expect.any(Object),
    });
    expect(result).toEqual(sampleOrderWithRelations);
  });

  it('deve criar pedido em transação sem abater estoque quando status for Pendente', async () => {
    const { mockPrisma, createOrderMock, updateProductMock } = createMockPrisma();
    createOrderMock.mockResolvedValue(sampleOrderWithRelations as any);
    const repository = new PrismaOrdersRepository(mockPrisma);

    const items = [{ productId: 'prod-1', quantidade: 2, precoUnitario: new Prisma.Decimal(50) }];
    const total = new Prisma.Decimal(100);

    const result = await repository.createOrderInTransaction(
      items,
      total,
      OrderStatus.PENDENTE,
      false,
    );

    expect(createOrderMock).toHaveBeenCalled();
    expect(updateProductMock).not.toHaveBeenCalled();
    expect(result).toEqual(sampleOrderWithRelations);
  });

  it('deve abater estoque ao criar pedido com status Concluído', async () => {
    const { mockPrisma, findUniqueProductMock, updateProductMock, createOrderMock } = createMockPrisma();
    findUniqueProductMock.mockResolvedValue({
      id: 'prod-1',
      nome: 'Produto A',
      quantidade_estoque: 10,
    } as any);
    createOrderMock.mockResolvedValue(sampleOrderWithRelations as any);
    const repository = new PrismaOrdersRepository(mockPrisma);

    const items = [{ productId: 'prod-1', quantidade: 2, precoUnitario: new Prisma.Decimal(50) }];
    const total = new Prisma.Decimal(100);

    const result = await repository.createOrderInTransaction(
      items,
      total,
      OrderStatus.CONCLUIDO,
      true,
    );

    expect(findUniqueProductMock).toHaveBeenCalledWith({ where: { id: 'prod-1' } });
    expect(updateProductMock).toHaveBeenCalledWith({
      where: { id: 'prod-1' },
      data: { quantidade_estoque: { decrement: 2 } },
    });
    expect(result).toEqual(sampleOrderWithRelations);
  });

  it('deve lançar erro se produto não existir na transação de criação com baixa de estoque', async () => {
    const { mockPrisma, findUniqueProductMock } = createMockPrisma();
    findUniqueProductMock.mockResolvedValue(null);
    const repository = new PrismaOrdersRepository(mockPrisma);

    const items = [{ productId: 'prod-inexistente', quantidade: 1, precoUnitario: new Prisma.Decimal(10) }];

    await expect(
      repository.createOrderInTransaction(items, new Prisma.Decimal(10), OrderStatus.CONCLUIDO, true),
    ).rejects.toThrow(BadRequestException);
  });

  it('deve lançar erro se estoque for insuficiente na transação de criação', async () => {
    const { mockPrisma, findUniqueProductMock } = createMockPrisma();
    findUniqueProductMock.mockResolvedValue({
      id: 'prod-1',
      nome: 'Produto A',
      quantidade_estoque: 1,
    } as any);
    const repository = new PrismaOrdersRepository(mockPrisma);

    const items = [{ productId: 'prod-1', quantidade: 5, precoUnitario: new Prisma.Decimal(10) }];

    await expect(
      repository.createOrderInTransaction(items, new Prisma.Decimal(50), OrderStatus.CONCLUIDO, true),
    ).rejects.toThrow(BadRequestException);
  });

  it('deve concluir pedido abatendo estoque na transação', async () => {
    const { mockPrisma, findUniqueProductMock, updateProductMock, updateOrderMock } = createMockPrisma();
    findUniqueProductMock.mockResolvedValue({
      id: 'prod-1',
      nome: 'Produto A',
      quantidade_estoque: 10,
    } as any);
    const completedOrder = { ...sampleOrderWithRelations, status: OrderStatus.CONCLUIDO };
    updateOrderMock.mockResolvedValue(completedOrder as any);
    const repository = new PrismaOrdersRepository(mockPrisma);

    const result = await repository.completeOrderInTransaction(sampleOrderWithRelations);

    expect(updateProductMock).toHaveBeenCalledWith({
      where: { id: 'prod-1' },
      data: { quantidade_estoque: { decrement: 2 } },
    });
    expect(updateOrderMock).toHaveBeenCalledWith({
      where: { id: sampleOrderWithRelations.id },
      data: { status: OrderStatus.CONCLUIDO },
      include: expect.any(Object),
    });
    expect(result.status).toBe(OrderStatus.CONCLUIDO);
  });

  it('deve falhar ao concluir pedido se o produto não for encontrado no banco', async () => {
    const { mockPrisma, findUniqueProductMock } = createMockPrisma();
    findUniqueProductMock.mockResolvedValue(null);
    const repository = new PrismaOrdersRepository(mockPrisma);

    await expect(
      repository.completeOrderInTransaction(sampleOrderWithRelations),
    ).rejects.toThrow(BadRequestException);
  });

  it('deve falhar ao concluir pedido se o estoque for insuficiente no momento da conclusão', async () => {
    const { mockPrisma, findUniqueProductMock } = createMockPrisma();
    findUniqueProductMock.mockResolvedValue({
      id: 'prod-1',
      nome: 'Produto A',
      quantidade_estoque: 1, // precisa de 2
    } as any);
    const repository = new PrismaOrdersRepository(mockPrisma);

    await expect(
      repository.completeOrderInTransaction(sampleOrderWithRelations),
    ).rejects.toThrow(BadRequestException);
  });

  it('deve cancelar pedido estornando estoque quando shouldRestock for true', async () => {
    const { mockPrisma, updateProductMock, updateOrderMock } = createMockPrisma();
    const canceledOrder = { ...sampleOrderWithRelations, status: OrderStatus.CANCELADO };
    updateOrderMock.mockResolvedValue(canceledOrder as any);
    const repository = new PrismaOrdersRepository(mockPrisma);

    const result = await repository.cancelOrderInTransaction(sampleOrderWithRelations, true);

    expect(updateProductMock).toHaveBeenCalledWith({
      where: { id: 'prod-1' },
      data: { quantidade_estoque: { increment: 2 } },
    });
    expect(result.status).toBe(OrderStatus.CANCELADO);
  });

  it('deve cancelar pedido sem estornar estoque quando shouldRestock for false', async () => {
    const { mockPrisma, updateProductMock, updateOrderMock } = createMockPrisma();
    const canceledOrder = { ...sampleOrderWithRelations, status: OrderStatus.CANCELADO };
    updateOrderMock.mockResolvedValue(canceledOrder as any);
    const repository = new PrismaOrdersRepository(mockPrisma);

    const result = await repository.cancelOrderInTransaction(sampleOrderWithRelations, false);

    expect(updateProductMock).not.toHaveBeenCalled();
    expect(result.status).toBe(OrderStatus.CANCELADO);
  });
});
