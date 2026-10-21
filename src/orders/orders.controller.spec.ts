import { describe, expect, it, vi } from 'vitest';
import { OrderStatus } from '@prisma/client';
import type { CreateOrderDto } from './dto/create-order.dto.js';
import type { UpdateOrderStatusDto } from './dto/update-order-status.dto.js';
import { OrdersController } from './orders.controller.js';
import type { OrdersService } from './orders.service.js';

describe('OrdersController', () => {
  const createMock = vi.fn();
  const findAllMock = vi.fn();
  const findByIdMock = vi.fn();
  const updateStatusMock = vi.fn();

  const mockOrdersService = {
    create: createMock,
    findAll: findAllMock,
    findById: findByIdMock,
    updateStatus: updateStatusMock,
  } as unknown as OrdersService;

  const controller = new OrdersController(mockOrdersService);

  const sampleOrder = {
    id: 'c2b5d480-1a1a-4c4f-9e6b-7c70f3f3e111',
    total_pedido: 500,
    status: OrderStatus.PENDENTE,
    produtos: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('deve registrar um pedido chamando o serviço', async () => {
    const dto: CreateOrderDto = {
      produtos: [{ productId: 'p1', quantidade: 2 }],
      status: OrderStatus.PENDENTE,
    };

    createMock.mockResolvedValue(sampleOrder as any);

    const result = await controller.create(dto);

    expect(createMock).toHaveBeenCalledWith(dto);
    expect(result).toEqual(sampleOrder);
  });

  it('deve listar todos os pedidos', async () => {
    findAllMock.mockResolvedValue([sampleOrder as any]);

    const result = await controller.findAll();

    expect(findAllMock).toHaveBeenCalled();
    expect(result).toEqual([sampleOrder]);
  });

  it('deve buscar um pedido por ID', async () => {
    findByIdMock.mockResolvedValue(sampleOrder as any);

    const result = await controller.findById(sampleOrder.id);

    expect(findByIdMock).toHaveBeenCalledWith(sampleOrder.id);
    expect(result).toEqual(sampleOrder);
  });

  it('deve atualizar o status de um pedido', async () => {
    const dto: UpdateOrderStatusDto = { status: OrderStatus.CONCLUIDO };
    const completedOrder = { ...sampleOrder, status: OrderStatus.CONCLUIDO };
    updateStatusMock.mockResolvedValue(completedOrder as any);

    const result = await controller.updateStatus(sampleOrder.id, dto);

    expect(updateStatusMock).toHaveBeenCalledWith(sampleOrder.id, dto);
    expect(result).toEqual(completedOrder);
  });
});
