import { describe, expect, it, vi } from 'vitest';
import { type ExecutionContext, UnauthorizedException } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard.js';

describe('JwtAuthGuard', () => {
  const getAllAndOverrideMock = vi.fn();

  const mockReflector = {
    getAllAndOverride: getAllAndOverrideMock,
  } as unknown as Reflector;

  const guard = new JwtAuthGuard(mockReflector);

  const createMockContext = () =>
    ({
      getHandler: () => {},
      getClass: () => {},
    }) as unknown as ExecutionContext;

  it('deve retornar true diretamente se a rota estiver anotada como @Public()', () => {
    getAllAndOverrideMock.mockReturnValue(true);
    const context = createMockContext();

    const result = guard.canActivate(context);

    expect(result).toBe(true);
  });

  it('deve delegar para super.canActivate quando a rota não for pública', () => {
    getAllAndOverrideMock.mockReturnValue(false);
    const context = createMockContext();
    const superCanActivateSpy = vi
      .spyOn(Object.getPrototypeOf(JwtAuthGuard.prototype), 'canActivate')
      .mockReturnValue(true as any);

    const result = guard.canActivate(context);

    expect(result).toBe(true);
    expect(superCanActivateSpy).toHaveBeenCalledWith(context);
    superCanActivateSpy.mockRestore();
  });

  it('deve retornar o usuário autenticado em handleRequest quando válido', () => {
    const mockUser = { userId: '123', email: 'user@canopy.com' };

    const result = guard.handleRequest(null, mockUser, null);

    expect(result).toEqual(mockUser);
  });

  it('deve lançar UnauthorizedException em handleRequest quando usuário for nulo', () => {
    expect(() => guard.handleRequest(null, null, null)).toThrow(
      UnauthorizedException,
    );
  });

  it('deve repassar o erro original caso já exista erro em handleRequest', () => {
    const customError = new Error('Token expirado');

    expect(() => guard.handleRequest(customError, null, null)).toThrow(customError);
  });
});
