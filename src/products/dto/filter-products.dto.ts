import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class FilterProductsDto {
  @ApiPropertyOptional({
    description: 'Filtrar por nome do produto (busca parcial, não diferencia maiúsculas/minúsculas)',
    example: 'Sensor',
  })
  @IsOptional()
  @IsString()
  nome?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por categoria do produto (busca parcial, não diferencia maiúsculas/minúsculas)',
    example: 'Monitoramento',
  })
  @IsOptional()
  @IsString()
  categoria?: string;

  @ApiPropertyOptional({
    description: 'Preço mínimo do produto para filtro',
    example: 100.0,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  precoMin?: number;

  @ApiPropertyOptional({
    description: 'Preço máximo do produto para filtro',
    example: 5000.0,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  precoMax?: number;
}
