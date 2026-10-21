import { describe, expect, it } from 'vitest';
import type { CallHandler, ExecutionContext } from '@nestjs/common';
import { lastValueFrom, of } from 'rxjs';
import { TransformInterceptor } from './transform.interceptor.js';

describe('TransformInterceptor', () => {
  const interceptor = new TransformInterceptor();

  it('deve encapsular a resposta com envelope padronizado { success: true, data, timestamp }', async () => {
    const mockContext = {} as ExecutionContext;
    const payload = { id: 'p1', nome: 'Produto A' };

    const mockCallHandler: CallHandler = {
      handle: () => of(payload),
    };

    const observable = interceptor.intercept(mockContext, mockCallHandler);
    const result = await lastValueFrom(observable);

    expect(result.success).toBe(true);
    expect(result.data).toEqual(payload);
    expect(typeof result.timestamp).toBe('string');
  });
});
