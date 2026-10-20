import { ApiProperty } from '@nestjs/swagger';

export class LoginResponseDto {
  @ApiProperty({
    description: 'Token JWT assinado para autenticação nas requisições subsequentes',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  access_token: string;

  @ApiProperty({
    description: 'Tipo do token de autenticação',
    example: 'Bearer',
  })
  token_type: string;

  @ApiProperty({
    description: 'Tempo de validade do token gerado',
    example: '24h',
  })
  expires_in: string;
}
