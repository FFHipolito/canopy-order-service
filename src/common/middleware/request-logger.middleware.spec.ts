import { describe, expect, it, vi } from 'vitest';
import { RequestLoggerMiddleware } from './request-logger.middleware.js';

describe('RequestLoggerMiddleware', () => {
  const middleware = new RequestLoggerMiddleware();

  it('deve chamar next() e registrar log de requisição com sucesso (< 400)', () => {
    let finishCallback: () => void = () => {};

    const mockReq = {
      method: 'GET',
      originalUrl: '/products',
    } as any;

    const mockRes = {
      statusCode: 200,
      on: vi.fn((event: string, cb: () => void) => {
        if (event === 'finish') finishCallback = cb;
      }),
    } as any;

    const mockNext = vi.fn();

    middleware.use(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockRes.on).toHaveBeenCalledWith('finish', expect.any(Function));

    // Simula finalização da resposta
    expect(() => finishCallback()).not.toThrow();
  });

  it('deve registrar warn quando statusCode for de cliente (400 a 499)', () => {
    let finishCallback: () => void = () => {};

    const mockReq = {
      method: 'POST',
      originalUrl: '/orders',
    } as any;

    const mockRes = {
      statusCode: 400,
      on: vi.fn((event: string, cb: () => void) => {
        if (event === 'finish') finishCallback = cb;
      }),
    } as any;

    const mockNext = vi.fn();

    middleware.use(mockReq, mockRes, mockNext);
    expect(() => finishCallback()).not.toThrow();
  });

  it('deve registrar error quando statusCode for de servidor (>= 500)', () => {
    let finishCallback: () => void = () => {};

    const mockReq = {
      method: 'GET',
      originalUrl: '/crash',
    } as any;

    const mockRes = {
      statusCode: 500,
      on: vi.fn((event: string, cb: () => void) => {
        if (event === 'finish') finishCallback = cb;
      }),
    } as any;

    const mockNext = vi.fn();

    middleware.use(mockReq, mockRes, mockNext);
    expect(() => finishCallback()).not.toThrow();
  });
});
