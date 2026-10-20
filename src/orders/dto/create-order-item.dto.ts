import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsUUID, Min } from 'class-validator';

export class CreateOrderItemDto {
  @ApiProperty({
    description: 'Identificador único do produto (UUID v4)',
    example: 'd9b7a480-1a1a-4c4f-9e6b-7c70f3f3e1a0',
  })
  @IsUUID('4', { message: 'O productId deve ser um UUID v4 válido' })
  @IsNotEmpty({ message: 'O productId é obrigatório' })
  productId: string;

  @ApiProperty({
    description: 'Quantidade solicitada do produto (deve ser no mínimo 1)',
    example: 5,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt({ message: 'A quantidade deve ser um número inteiro' })
  @Min(1, { message: 'A quantidade solicitada deve ser de no mínimo 1' })
  quantidade: number;
}
