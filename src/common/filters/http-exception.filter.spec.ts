import { describe, expect, it, vi } from 'vitest';
import {
  type ArgumentsHost,
  BadRequestException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter.js';

describe('HttpExceptionFilter', () => {
  const filter = new HttpExceptionFilter();

  const createMockHost = (url = '/test-url') => {
    const mockJson = vi.fn();
    const mockStatus = vi.fn().mockReturnValue({ json: mockJson });

    const mockResponse = {
      status: mockStatus,
      json: mockJson,
    };

    const mockRequest = {
      url,
      method: 'GET',
    };

    const mockHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    } as unknown as ArgumentsHost;

    return { mockHost, mockStatus, mockJson };
  };

  it('deve capturar HttpException com corpo em objeto', () => {
    const { mockHost, mockStatus, mockJson } = createMockHost('/products');
    const exception = new BadRequestException('Estoque insuficiente');

    filter.catch(exception, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Estoque insuficiente',
        path: '/products',
      }),
    );
  });

  it('deve capturar HttpException com corpo em string simples', () => {
    const { mockHost, mockStatus, mockJson } = createMockHost('/orders');
    const exception = new HttpException('Acesso negado', HttpStatus.FORBIDDEN);

    filter.catch(exception, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        statusCode: HttpStatus.FORBIDDEN,
        message: 'Acesso negado',
        path: '/orders',
      }),
    );
  });

  it('deve capturar erro desconhecido (não-HttpException) retornando 500', () => {
    const { mockHost, mockStatus, mockJson } = createMockHost('/crash');
    const exception = new Error('Falha inesperada no banco');

    filter.catch(exception, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Erro interno no servidor.',
        error: 'Internal Server Error',
        path: '/crash',
      }),
    );
  });
});
