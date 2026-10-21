import { describe, expect, it, vi } from 'vitest';
import { AuthController } from './auth.controller.js';
import type { AuthService } from './auth.service.js';
import type { LoginDto } from './dto/login.dto.js';

describe('AuthController', () => {
  const loginMock = vi.fn();

  const mockAuthService = {
    login: loginMock,
  } as unknown as AuthService;

  const controller = new AuthController(mockAuthService);

  it('deve realizar login chamando o AuthService', async () => {
    const loginDto: LoginDto = {
      email: 'admin@canopy.com.br',
      senha: 'Canopy#2026',
    };

    const loginResponse = {
      access_token: 'fake_jwt_token',
      token_type: 'Bearer',
      expires_in: '24h',
      user: {
        id: 'user-uuid',
        email: 'admin@canopy.com.br',
        role: 'ADMIN',
      },
    };

    loginMock.mockResolvedValue(loginResponse);

    const result = await controller.login(loginDto);

    expect(loginMock).toHaveBeenCalledWith(loginDto);
    expect(result).toEqual(loginResponse);
  });

  it('deve retornar o perfil do usuário presente no request', () => {
    const mockRequest = {
      user: {
        userId: 'u1',
        email: 'admin@canopy.com.br',
        role: 'ADMIN',
      },
    };

    const result = controller.getProfile(mockRequest);

    expect(result).toEqual(mockRequest.user);
  });
});
