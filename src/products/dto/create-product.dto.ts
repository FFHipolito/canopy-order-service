import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Length,
  Min,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty({
    description: 'Nome do produto',
    example: 'Sensor IoT de Umidade do Solo',
    minLength: 2,
    maxLength: 255,
  })
  @IsString({ message: 'O nome deve ser uma cadeia de caracteres válida' })
  @IsNotEmpty({ message: 'O nome do produto é obrigatório' })
  @Length(2, 255, { message: 'O nome deve ter entre 2 e 255 caracteres' })
  nome: string;

  @ApiProperty({
    description: 'Categoria do produto',
    example: 'Monitoramento Florestal',
  })
  @IsString({ message: 'A categoria deve ser uma cadeia de caracteres válida' })
  @IsNotEmpty({ message: 'A categoria do produto é obrigatória' })
  categoria: string;

  @ApiPropertyOptional({
    description: 'Descrição detalhada do produto',
    example: 'Sensor inteligente subsuperficial com telemetria LoRaWAN integrada para silvicultura.',
  })
  @IsOptional()
  @IsString({ message: 'A descrição deve ser uma cadeia de caracteres válida' })
  descricao?: string;

  @ApiProperty({
    description: 'Preço unitário do produto (deve ser estritamente maior que zero)',
    example: 450.0,
    minimum: 0.01,
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'O preço deve ser um número válido com até 2 casas decimais' })
  @IsPositive({ message: 'O preço deve ser estritamente positivo' })
  @Min(0.01, { message: 'O preço deve ser de no mínimo 0.01' })
  preco: number;

  @ApiProperty({
    description: 'Quantidade em estoque (não pode ser negativa)',
    example: 80,
    minimum: 0,
  })
  @Type(() => Number)
  @IsInt({ message: 'A quantidade de estoque deve ser um número inteiro' })
  @Min(0, { message: 'A quantidade em estoque não pode ser negativa' })
  quantidade_estoque: number;
}
