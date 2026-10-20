import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from '@prisma/client';
import { OrderItemEntity } from './order-item.entity.js';

export class OrderEntity {
  @ApiProperty({
    description: 'Identificador único do pedido (UUID v4)',
    example: 'c2b5d480-1a1a-4c4f-9e6b-7c70f3f3e111',
  })
  id: string;

  @ApiProperty({
    description: 'Valor total do pedido calculado a partir da soma dos itens',
    example: 1350.0,
  })
  total_pedido: number | string;

  @ApiProperty({
    description: 'Status atual do pedido no fluxo de compra',
    enum: OrderStatus,
    example: OrderStatus.PENDENTE,
  })
  status: OrderStatus;

  @ApiProperty({
    description: 'Lista de produtos contidos no pedido',
    type: [OrderItemEntity],
  })
  produtos: OrderItemEntity[];

  @ApiProperty({
    description: 'Data e hora da realização do pedido',
    example: '2026-10-20T12:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Data e hora da última modificação do pedido',
    example: '2026-10-20T12:00:00.000Z',
  })
  updatedAt: Date;
}
