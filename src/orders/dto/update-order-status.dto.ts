import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from '@prisma/client';
import { IsEnum, IsNotEmpty } from 'class-validator';

export class UpdateOrderStatusDto {
  @ApiProperty({
    description: 'Novo status a ser atribuído ao pedido',
    enum: OrderStatus,
    example: OrderStatus.CONCLUIDO,
  })
  @IsNotEmpty({ message: 'O status do pedido é obrigatório' })
  @IsEnum(OrderStatus, {
    message: 'O status do pedido deve ser PENDENTE, CONCLUIDO ou CANCELADO',
  })
  status: OrderStatus;
}
