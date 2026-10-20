import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsEnum, IsOptional, ValidateNested } from 'class-validator';
import { CreateOrderItemDto } from './create-order-item.dto.js';

export class CreateOrderDto {
  @ApiProperty({
    description: 'Lista de itens que compõem o pedido',
    type: [CreateOrderItemDto],
    example: [
      {
        productId: 'd9b7a480-1a1a-4c4f-9e6b-7c70f3f3e1a0',
        quantidade: 2,
      },
    ],
  })
  @IsArray({ message: 'O campo produtos deve ser uma lista de itens' })
  @ArrayMinSize(1, { message: 'O pedido deve conter pelo menos 1 item' })
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  produtos: CreateOrderItemDto[];

  @ApiPropertyOptional({
    description: 'Status inicial do pedido. Se não informado, o padrão é PENDENTE.',
    enum: OrderStatus,
    example: OrderStatus.PENDENTE,
  })
  @IsOptional()
  @IsEnum(OrderStatus, {
    message: 'O status do pedido deve ser PENDENTE, CONCLUIDO ou CANCELADO',
  })
  status?: OrderStatus;
}
