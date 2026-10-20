import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { LoginResponseDto } from './dto/login-response.dto.js';
import type { LoginDto } from './dto/login.dto.js';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  // Credenciais industriais padrão para avaliação técnica e testes locais
  private readonly defaultUsers = [
    {
      id: 'a0000000-0000-0000-0000-000000000001',
      email: 'admin@canopy.com.br',
      senha: 'Canopy#2026',
      role: 'ADMIN',
    },
    {
      id: 'a0000000-0000-0000-0000-000000000002',
      email: 'operador@canopy.com.br',
      senha: 'Canopy#2026',
      role: 'OPERATOR',
    },
  ];

  constructor(private readonly jwtService: JwtService) {}

  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    const user = this.defaultUsers.find(
      (u) => u.email.toLowerCase() === loginDto.email.toLowerCase(),
    );

    if (!user || user.senha !== loginDto.senha) {
      this.logger.warn(
        `Tentativa de autenticação falha para o e-mail: ${loginDto.email}`,
      );
      throw new UnauthorizedException(
        'Credenciais inválidas. Verifique o e-mail e a senha informados.',
      );
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);

    this.logger.log(`Usuário "${user.email}" autenticado com sucesso.`);

    return {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: '24h',
    };
  }
}
