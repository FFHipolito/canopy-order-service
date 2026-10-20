import { BadRequestException, Injectable } from '@nestjs/common';
import { OrderStatus, type Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import {
  OrdersRepository,
  type OrderWithRelations,
  type PreparedOrderItem,
} from './orders.repository.interface.js';

@Injectable()
export class PrismaOrdersRepository implements OrdersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<OrderWithRelations[]> {
    return this.prisma.order.findMany({
      include: {
        produtos: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string): Promise<OrderWithRelations | null> {
    return this.prisma.order.findUnique({
      where: { id },
      include: {
        produtos: {
          include: {
            product: true,
          },
        },
      },
    });
  }

  async createOrderInTransaction(
    items: PreparedOrderItem[],
    total: Prisma.Decimal,
    status: OrderStatus,
    shouldDecrementStock: boolean,
  ): Promise<OrderWithRelations> {
    return this.prisma.$transaction(async (tx) => {
      // 1. Caso o pedido seja criado como CONCLUIDO, valida e abate estoque atomicamente
      if (shouldDecrementStock) {
        for (const item of items) {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
          });

          if (!product) {
            throw new BadRequestException(
              `Produto de ID "${item.productId}" não encontrado durante a transação.`,
            );
          }

          if (product.quantidade_estoque < item.quantidade) {
            throw new BadRequestException(
              `Estoque insuficiente para o produto "${product.nome}". Solicitado: ${item.quantidade}, Disponível: ${product.quantidade_estoque}.`,
            );
          }

          await tx.product.update({
            where: { id: item.productId },
            data: {
              quantidade_estoque: {
                decrement: item.quantidade,
              },
            },
          });
        }
      }

      // 2. Persiste o pedido e os itens vinculados atomicamente
      const createdOrder = await tx.order.create({
        data: {
          total_pedido: total,
          status,
          produtos: {
            create: items.map((item) => ({
              productId: item.productId,
              quantidade: item.quantidade,
              precoUnitario: item.precoUnitario,
            })),
          },
        },
        include: {
          produtos: {
            include: {
              product: true,
            },
          },
        },
      });

      return createdOrder;
    });
  }

  async completeOrderInTransaction(
    order: OrderWithRelations,
  ): Promise<OrderWithRelations> {
    return this.prisma.$transaction(async (tx) => {
      for (const item of order.produtos) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (!product) {
          throw new BadRequestException(
            `Produto "${item.productId}" não encontrado ao tentar concluir o pedido.`,
          );
        }

        if (product.quantidade_estoque < item.quantidade) {
          throw new BadRequestException(
            `Estoque insuficiente para concluir o pedido. Produto "${product.nome}" possui apenas ${product.quantidade_estoque} unidade(s) disponível(is), mas o pedido requer ${item.quantidade}.`,
          );
        }

        await tx.product.update({
          where: { id: item.productId },
          data: {
            quantidade_estoque: {
              decrement: item.quantidade,
            },
          },
        });
      }

      return tx.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.CONCLUIDO },
        include: {
          produtos: {
            include: {
              product: true,
            },
          },
        },
      });
    });
  }

  async cancelOrderInTransaction(
    order: OrderWithRelations,
    shouldRestock: boolean,
  ): Promise<OrderWithRelations> {
    return this.prisma.$transaction(async (tx) => {
      if (shouldRestock) {
        for (const item of order.produtos) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              quantidade_estoque: {
                increment: item.quantidade,
              },
            },
          });
        }
      }

      return tx.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.CANCELADO },
        include: {
          produtos: {
            include: {
              product: true,
            },
          },
        },
      });
    });
  }
}
