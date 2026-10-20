import type { OrderStatus, Prisma } from '@prisma/client';

export type OrderWithRelations = Prisma.OrderGetPayload<{
  include: {
    produtos: {
      include: {
        product: true;
      };
    };
  };
}>;

export interface PreparedOrderItem {
  productId: string;
  quantidade: number;
  precoUnitario: Prisma.Decimal;
}

export abstract class OrdersRepository {
  abstract findAll(): Promise<OrderWithRelations[]>;
  abstract findById(id: string): Promise<OrderWithRelations | null>;
  abstract createOrderInTransaction(
    items: PreparedOrderItem[],
    total: Prisma.Decimal,
    status: OrderStatus,
    shouldDecrementStock: boolean,
  ): Promise<OrderWithRelations>;
  abstract completeOrderInTransaction(
    order: OrderWithRelations,
  ): Promise<OrderWithRelations>;
  abstract cancelOrderInTransaction(
    order: OrderWithRelations,
    shouldRestock: boolean,
  ): Promise<OrderWithRelations>;
}
