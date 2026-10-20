import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma, type Product } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CreateProductDto } from './dto/create-product.dto.js';
import type { UpdateProductDto } from './dto/update-product.dto.js';
import { ProductsService } from './products.service.js';
import { ProductsRepository } from './repositories/products.repository.interface.js';

describe('ProductsService', () => {
  let service: ProductsService;

  const mockProduct: Product = {
    id: 'd9b7a480-1a1a-4c4f-9e6b-7c70f3f3e1a0',
    nome: 'Sensor IoT de Umidade do Solo',
    categoria: 'Monitoramento Florestal',
    descricao: 'Sensor de alta precisão para manejo de solo.',
    preco: new Prisma.Decimal(450.0),
    quantidade_estoque: 80,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const createMock = vi.fn();
  const findAllMock = vi.fn();
  const findByIdMock = vi.fn();
  const findByIdsMock = vi.fn();
  const updateMock = vi.fn();
  const deleteMock = vi.fn();

  const mockProductsRepository = {
    create: createMock,
    findAll: findAllMock,
    findById: findByIdMock,
    findByIds: findByIdsMock,
    update: updateMock,
    delete: deleteMock,
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: ProductsRepository,
          useValue: mockProductsRepository,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('deve criar um produto com sucesso', async () => {
      const createDto: CreateProductDto = {
        nome: 'Sensor IoT de Umidade do Solo',
        categoria: 'Monitoramento Florestal',
        descricao: 'Sensor de alta precisão para manejo de solo.',
        preco: 450.0,
        quantidade_estoque: 80,
      };

      createMock.mockResolvedValue(mockProduct);

      const result = await service.create(createDto);

      expect(createMock).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockProduct);
    });
  });

  describe('findAll', () => {
    it('deve retornar lista de produtos', async () => {
      findAllMock.mockResolvedValue([mockProduct]);

      const result = await service.findAll();

      expect(findAllMock).toHaveBeenCalledWith(undefined);
      expect(result).toEqual([mockProduct]);
    });
  });

  describe('findById', () => {
    it('deve retornar o produto quando encontrado pelo ID', async () => {
      findByIdMock.mockResolvedValue(mockProduct);

      const result = await service.findById(mockProduct.id);

      expect(findByIdMock).toHaveBeenCalledWith(mockProduct.id);
      expect(result).toEqual(mockProduct);
    });

    it('deve lançar NotFoundException quando o produto não existir', async () => {
      findByIdMock.mockResolvedValue(null);

      await expect(service.findById('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
      expect(findByIdMock).toHaveBeenCalledWith('non-existent-id');
    });
  });

  describe('update', () => {
    it('deve atualizar o produto com sucesso quando ele existir', async () => {
      const updateDto: UpdateProductDto = { preco: 500.0 };
      const updatedProduct = { ...mockProduct, preco: new Prisma.Decimal(500.0) };

      findByIdMock.mockResolvedValue(mockProduct);
      updateMock.mockResolvedValue(updatedProduct);

      const result = await service.update(mockProduct.id, updateDto);

      expect(findByIdMock).toHaveBeenCalledWith(mockProduct.id);
      expect(updateMock).toHaveBeenCalledWith(mockProduct.id, updateDto);
      expect(result).toEqual(updatedProduct);
    });

    it('deve lançar NotFoundException ao tentar atualizar produto inexistente', async () => {
      findByIdMock.mockResolvedValue(null);

      await expect(
        service.update('non-existent-id', { preco: 500.0 }),
      ).rejects.toThrow(NotFoundException);
      expect(updateMock).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('deve deletar o produto com sucesso quando ele existir', async () => {
      findByIdMock.mockResolvedValue(mockProduct);
      deleteMock.mockResolvedValue(mockProduct);

      const result = await service.delete(mockProduct.id);

      expect(findByIdMock).toHaveBeenCalledWith(mockProduct.id);
      expect(deleteMock).toHaveBeenCalledWith(mockProduct.id);
      expect(result).toEqual(mockProduct);
    });

    it('deve lançar NotFoundException ao tentar deletar produto inexistente', async () => {
      findByIdMock.mockResolvedValue(null);

      await expect(service.delete('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
      expect(deleteMock).not.toHaveBeenCalled();
    });

    it('deve lançar ConflictException quando o produto estiver associado a pedidos', async () => {
      findByIdMock.mockResolvedValue(mockProduct);
      deleteMock.mockRejectedValue({ code: 'P2003' });

      await expect(service.delete(mockProduct.id)).rejects.toThrow(
        ConflictException,
      );
    });

    it('deve relançar erro genérico se a exclusão falhar por outro motivo', async () => {
      findByIdMock.mockResolvedValue(mockProduct);
      deleteMock.mockRejectedValue(new Error('Falha de I/O no banco'));

      await expect(service.delete(mockProduct.id)).rejects.toThrow(
        'Falha de I/O no banco',
      );
    });
  });
});
