import { describe, expect, it, vi } from 'vitest';
import type { CreateProductDto } from './dto/create-product.dto.js';
import type { FilterProductsDto } from './dto/filter-products.dto.js';
import type { UpdateProductDto } from './dto/update-product.dto.js';
import { ProductsController } from './products.controller.js';
import type { ProductsService } from './products.service.js';

describe('ProductsController', () => {
  const createMock = vi.fn();
  const findAllMock = vi.fn();
  const findByIdMock = vi.fn();
  const updateMock = vi.fn();
  const deleteMock = vi.fn();

  const mockProductsService = {
    create: createMock,
    findAll: findAllMock,
    findById: findByIdMock,
    update: updateMock,
    delete: deleteMock,
  } as unknown as ProductsService;

  const controller = new ProductsController(mockProductsService);

  const sampleProduct = {
    id: 'd9b7a480-1a1a-4c4f-9e6b-7c70f3f3e1a0',
    nome: 'Sensor IoT',
    categoria: 'Hardware',
    descricao: 'Sensor de umidade',
    preco: 250,
    quantidade_estoque: 10,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('deve cadastrar um produto chamando o serviço', async () => {
    const dto: CreateProductDto = {
      nome: 'Sensor IoT',
      categoria: 'Hardware',
      descricao: 'Sensor de umidade',
      preco: 250,
      quantidade_estoque: 10,
    };

    createMock.mockResolvedValue(sampleProduct as any);

    const result = await controller.create(dto);

    expect(createMock).toHaveBeenCalledWith(dto);
    expect(result).toEqual(sampleProduct);
  });

  it('deve listar produtos chamando o serviço com filtros', async () => {
    const filters: FilterProductsDto = { categoria: 'Hardware' };
    findAllMock.mockResolvedValue([sampleProduct as any]);

    const result = await controller.findAll(filters);

    expect(findAllMock).toHaveBeenCalledWith(filters);
    expect(result).toEqual([sampleProduct]);
  });

  it('deve buscar um produto por ID', async () => {
    findByIdMock.mockResolvedValue(sampleProduct as any);

    const result = await controller.findById(sampleProduct.id);

    expect(findByIdMock).toHaveBeenCalledWith(sampleProduct.id);
    expect(result).toEqual(sampleProduct);
  });

  it('deve atualizar um produto chamando o serviço', async () => {
    const updateDto: UpdateProductDto = { preco: 280 };
    const updated = { ...sampleProduct, preco: 280 };
    updateMock.mockResolvedValue(updated as any);

    const result = await controller.update(sampleProduct.id, updateDto);

    expect(updateMock).toHaveBeenCalledWith(sampleProduct.id, updateDto);
    expect(result).toEqual(updated);
  });

  it('deve excluir um produto chamando o serviço', async () => {
    deleteMock.mockResolvedValue(undefined as any);

    await controller.delete(sampleProduct.id);

    expect(deleteMock).toHaveBeenCalledWith(sampleProduct.id);
  });
});
