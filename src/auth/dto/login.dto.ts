import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'E-mail do operador/usuário da API',
    example: 'admin@canopy.com.br',
  })
  @IsEmail({}, { message: 'Forneça um endereço de e-mail válido' })
  @IsNotEmpty({ message: 'O e-mail é obrigatório' })
  email: string;

  @ApiProperty({
    description: 'Senha de acesso',
    example: 'Canopy#2026',
    minLength: 6,
  })
  @IsString({ message: 'A senha deve ser uma cadeia de caracteres' })
  @IsNotEmpty({ message: 'A senha é obrigatória' })
  @MinLength(6, { message: 'A senha deve conter no mínimo 6 caracteres' })
  senha: string;
}
