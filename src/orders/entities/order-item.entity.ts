import { ApiProperty } from '@nestjs/swagger';

export class OrderItemEntity {
  @ApiProperty({
    description: 'Identificador único do item do pedido (UUID v4)',
    example: '3f6c8d10-8b1a-4d2f-a9b1-5c70f3f3e999',
  })
  id: string;

  @ApiProperty({
    description: 'ID do pedido associado',
    example: 'c2b5d480-1a1a-4c4f-9e6b-7c70f3f3e111',
  })
  orderId: string;

  @ApiProperty({
    description: 'ID do produto vinculado ao item',
    example: 'd9b7a480-1a1a-4c4f-9e6b-7c70f3f3e1a0',
  })
  productId: string;

  @ApiProperty({
    description: 'Quantidade adquirida deste produto',
    example: 3,
  })
  quantidade: number;

  @ApiProperty({
    description: 'Preço unitário registrado no momento da compra (snapshot price)',
    example: 450.0,
  })
  precoUnitario: number | string;

  @ApiProperty({
    description: 'Data de inclusão do item no pedido',
    example: '2026-10-20T12:00:00.000Z',
  })
  createdAt: Date;
}
