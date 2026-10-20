import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { OrderStatus, Prisma, type Product } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProductsRepository } from '../products/repositories/products.repository.interface.js';
import type { CreateOrderDto } from './dto/create-order.dto.js';
import { OrdersService } from './orders.service.js';
import {
  OrdersRepository,
  type OrderWithRelations,
} from './repositories/orders.repository.interface.js';

describe('OrdersService', () => {
  let service: OrdersService;

  const mockProduct1: Product = {
    id: 'd9b7a480-1a1a-4c4f-9e6b-7c70f3f3e1a0',
    nome: 'Sensor IoT de Umidade do Solo',
    categoria: 'Monitoramento Florestal',
    descricao: 'Sensor de alta precisão para manejo de solo.',
    preco: new Prisma.Decimal(450.0),
    quantidade_estoque: 10,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockProduct2: Product = {
    id: 'e1c8b590-2b2b-4d5f-af7c-8d81f4f4f2b1',
    nome: 'Válvula Reguladora de Pressão',
    categoria: 'Equipamentos Hidráulicos',
    descricao: 'Válvula industrial para controle de vazão.',
    preco: new Prisma.Decimal(1200.0),
    quantidade_estoque: 5,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockOrder: OrderWithRelations = {
    id: 'c2b5d480-1a1a-4c4f-9e6b-7c70f3f3e111',
    total_pedido: new Prisma.Decimal(2100.0),
    status: OrderStatus.PENDENTE,
    createdAt: new Date(),
    updatedAt: new Date(),
    produtos: [
      {
        id: 'item-1',
        orderId: 'c2b5d480-1a1a-4c4f-9e6b-7c70f3f3e111',
        productId: mockProduct1.id,
        quantidade: 2,
        precoUnitario: new Prisma.Decimal(450.0),
        createdAt: new Date(),
        product: mockProduct1,
      },
      {
        id: 'item-2',
        orderId: 'c2b5d480-1a1a-4c4f-9e6b-7c70f3f3e111',
        productId: mockProduct2.id,
        quantidade: 1,
        precoUnitario: new Prisma.Decimal(1200.0),
        createdAt: new Date(),
        product: mockProduct2,
      },
    ],
  };

  const findAllOrdersMock = vi.fn();
  const findByIdOrderMock = vi.fn();
  const createOrderInTransactionMock = vi.fn();
  const completeOrderInTransactionMock = vi.fn();
  const cancelOrderInTransactionMock = vi.fn();

  const mockOrdersRepository = {
    findAll: findAllOrdersMock,
    findById: findByIdOrderMock,
    createOrderInTransaction: createOrderInTransactionMock,
    completeOrderInTransaction: completeOrderInTransactionMock,
    cancelOrderInTransaction: cancelOrderInTransactionMock,
  };

  const findByIdsProductsMock = vi.fn();
  const mockProductsRepository = {
    findByIds: findByIdsProductsMock,
    create: vi.fn(),
    findAll: vi.fn(),
    findById: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: OrdersRepository,
          useValue: mockOrdersRepository,
        },
        {
          provide: ProductsRepository,
          useValue: mockProductsRepository,
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('deve criar um pedido com sucesso e calcular o total corretamente', async () => {
      const createDto: CreateOrderDto = {
        produtos: [
          { productId: mockProduct1.id, quantidade: 2 },
          { productId: mockProduct2.id, quantidade: 1 },
        ],
        status: OrderStatus.PENDENTE,
      };

      findByIdsProductsMock.mockResolvedValue([mockProduct1, mockProduct2]);
      createOrderInTransactionMock.mockResolvedValue(mockOrder);

      const result = await service.create(createDto);

      expect(findByIdsProductsMock).toHaveBeenCalledWith([
        mockProduct1.id,
        mockProduct2.id,
      ]);
      expect(createOrderInTransactionMock).toHaveBeenCalledWith(
        [
          {
            productId: mockProduct1.id,
            quantidade: 2,
            precoUnitario: mockProduct1.preco,
          },
          {
            productId: mockProduct2.id,
            quantidade: 1,
            precoUnitario: mockProduct2.preco,
          },
        ],
        new Prisma.Decimal(2100.0), // (2 * 450) + (1 * 1200) = 2100
        OrderStatus.PENDENTE,
        false, // shouldDecrementStock is false for PENDENTE
      );
      expect(result).toEqual(mockOrder);
    });

    it('deve rejeitar o pedido quando a quantidade solicitada exceder o estoque disponível', async () => {
      const createDto: CreateOrderDto = {
        produtos: [{ productId: mockProduct1.id, quantidade: 15 }], // Estoque é 10
      };

      findByIdsProductsMock.mockResolvedValue([mockProduct1]);

      await expect(service.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(createOrderInTransactionMock).not.toHaveBeenCalled();
    });

    it('deve rejeitar o pedido se algum produto não for encontrado no catálogo', async () => {
      const createDto: CreateOrderDto = {
        produtos: [{ productId: 'non-existent-uuid', quantidade: 1 }],
      };

      findByIdsProductsMock.mockResolvedValue([]);

      await expect(service.create(createDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(createOrderInTransactionMock).not.toHaveBeenCalled();
    });

    it('deve solicitar baixa de estoque na transação caso o status inicial seja CONCLUIDO', async () => {
      const createDto: CreateOrderDto = {
        produtos: [{ productId: mockProduct1.id, quantidade: 1 }],
        status: OrderStatus.CONCLUIDO,
      };

      findByIdsProductsMock.mockResolvedValue([mockProduct1]);
      createOrderInTransactionMock.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.CONCLUIDO,
      });

      await service.create(createDto);

      expect(createOrderInTransactionMock).toHaveBeenCalledWith(
        expect.any(Array),
        expect.any(Prisma.Decimal),
        OrderStatus.CONCLUIDO,
        true, // shouldDecrementStock is true for CONCLUIDO
      );
    });
  });

  describe('updateStatus', () => {
    it('deve transicionar para CONCLUIDO e acionar baixa atômica via transação', async () => {
      findByIdOrderMock.mockResolvedValue(mockOrder);
      const completedOrder = { ...mockOrder, status: OrderStatus.CONCLUIDO };
      completeOrderInTransactionMock.mockResolvedValue(completedOrder);

      const result = await service.updateStatus(mockOrder.id, {
        status: OrderStatus.CONCLUIDO,
      });

      expect(completeOrderInTransactionMock).toHaveBeenCalledWith(mockOrder);
      expect(result.status).toBe(OrderStatus.CONCLUIDO);
    });

    it('deve rejeitar transição para CONCLUIDO caso o pedido esteja cancelado', async () => {
      const cancelledOrder = { ...mockOrder, status: OrderStatus.CANCELADO };
      findByIdOrderMock.mockResolvedValue(cancelledOrder);

      await expect(
        service.updateStatus(mockOrder.id, { status: OrderStatus.CONCLUIDO }),
      ).rejects.toThrow(BadRequestException);

      expect(completeOrderInTransactionMock).not.toHaveBeenCalled();
    });

    it('deve transicionar para CANCELADO e acionar estorno caso o pedido já estivesse concluído', async () => {
      const completedOrder = { ...mockOrder, status: OrderStatus.CONCLUIDO };
      findByIdOrderMock.mockResolvedValue(completedOrder);
      const cancelledOrder = { ...mockOrder, status: OrderStatus.CANCELADO };
      cancelOrderInTransactionMock.mockResolvedValue(cancelledOrder);

      const result = await service.updateStatus(mockOrder.id, {
        status: OrderStatus.CANCELADO,
      });

      expect(cancelOrderInTransactionMock).toHaveBeenCalledWith(
        completedOrder,
        true, // shouldRestock is true
      );
      expect(result.status).toBe(OrderStatus.CANCELADO);
    });

    it('deve transicionar para CANCELADO sem estorno caso o pedido estivesse pendente', async () => {
      findByIdOrderMock.mockResolvedValue(mockOrder); // Status PENDENTE
      const cancelledOrder = { ...mockOrder, status: OrderStatus.CANCELADO };
      cancelOrderInTransactionMock.mockResolvedValue(cancelledOrder);

      const result = await service.updateStatus(mockOrder.id, {
        status: OrderStatus.CANCELADO,
      });

      expect(cancelOrderInTransactionMock).toHaveBeenCalledWith(
        mockOrder,
        false, // shouldRestock is false
      );
      expect(result.status).toBe(OrderStatus.CANCELADO);
    });
  });
});
