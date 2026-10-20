import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from './auth.service.js';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;

  const mockJwtService = {
    sign: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('deve estar definido', () => {
    expect(service).toBeDefined();
    expect(jwtService).toBeDefined();
  });

  describe('login', () => {
    it('deve autenticar com sucesso e retornar token JWT para credenciais válidas', async () => {
      mockJwtService.sign.mockReturnValue('mocked.jwt.token');

      const result = await service.login({
        email: 'admin@canopy.com.br',
        senha: 'Canopy#2026',
      });

      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: 'a0000000-0000-0000-0000-000000000001',
        email: 'admin@canopy.com.br',
        role: 'ADMIN',
      });
      expect(result).toEqual({
        access_token: 'mocked.jwt.token',
        token_type: 'Bearer',
        expires_in: '24h',
      });
    });

    it('deve lançar UnauthorizedException caso a senha esteja incorreta', async () => {
      await expect(
        service.login({
          email: 'admin@canopy.com.br',
          senha: 'SenhaErrada123',
        }),
      ).rejects.toThrow(UnauthorizedException);

      expect(mockJwtService.sign).not.toHaveBeenCalled();
    });

    it('deve lançar UnauthorizedException caso o e-mail não seja encontrado', async () => {
      await expect(
        service.login({
          email: 'usuario.inexistente@canopy.com.br',
          senha: 'Canopy#2026',
        }),
      ).rejects.toThrow(UnauthorizedException);

      expect(mockJwtService.sign).not.toHaveBeenCalled();
    });
  });
});
