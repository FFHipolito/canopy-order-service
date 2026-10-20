import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProductEntity {
  @ApiProperty({
    description: 'Identificador único universal (UUID v4) do produto',
    example: 'd9b7a480-1a1a-4c4f-9e6b-7c70f3f3e1a0',
  })
  id: string;

  @ApiProperty({
    description: 'Nome comercial do produto',
    example: 'Válvula de Controle de Pressão Industrial',
  })
  nome: string;

  @ApiProperty({
    description: 'Categoria do produto no catálogo',
    example: 'Equipamentos Hidráulicos',
  })
  categoria: string;

  @ApiPropertyOptional({
    description: 'Descrição detalhada e especificações do produto',
    example: 'Válvula reguladora proporcional para sistemas industriais de alta pressão.',
    nullable: true,
  })
  descricao?: string | null;

  @ApiProperty({
    description: 'Preço unitário do produto com duas casas decimais',
    example: 1850.5,
  })
  preco: number | string;

  @ApiProperty({
    description: 'Quantidade disponível atualmente em estoque',
    example: 45,
  })
  quantidade_estoque: number;

  @ApiProperty({
    description: 'Data e hora da criação do registro',
    example: '2026-10-20T12:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Data e hora da última atualização do registro',
    example: '2026-10-20T12:00:00.000Z',
  })
  updatedAt: Date;
}
