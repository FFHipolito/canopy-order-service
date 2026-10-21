import { describe, expect, it } from 'vitest';
import { JwtStrategy } from './jwt.strategy.js';

describe('JwtStrategy', () => {
  const strategy = new JwtStrategy();

  it('deve extrair e validar os campos corretos do payload JWT', async () => {
    const payload = {
      sub: 'user-uuid-123',
      email: 'admin@canopy.com.br',
      role: 'ADMIN',
    };

    const result = await strategy.validate(payload);

    expect(result).toEqual({
      userId: 'user-uuid-123',
      email: 'admin@canopy.com.br',
      role: 'ADMIN',
    });
  });
});
