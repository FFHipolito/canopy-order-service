import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { Product } from '@prisma/client';
import type { CreateProductDto } from './dto/create-product.dto.js';
import type { FilterProductsDto } from './dto/filter-products.dto.js';
import type { UpdateProductDto } from './dto/update-product.dto.js';
import { ProductsRepository } from './repositories/products.repository.interface.js';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(private readonly productsRepository: ProductsRepository) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    this.logger.log(`Criando novo produto: "${createProductDto.nome}"`);
    return this.productsRepository.create(createProductDto);
  }

  async findAll(filters?: FilterProductsDto): Promise<Product[]> {
    return this.productsRepository.findAll(filters);
  }

  async findById(id: string): Promise<Product> {
    const product = await this.productsRepository.findById(id);
    if (!product) {
      throw new NotFoundException(`Produto com ID "${id}" não encontrado.`);
    }
    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    // Garante que o produto existe antes de tentar atualizar
    await this.findById(id);

    this.logger.log(`Atualizando produto ID "${id}"`);
    return this.productsRepository.update(id, updateProductDto);
  }

  async delete(id: string): Promise<Product> {
    // Garante que o produto existe antes de tentar deletar
    await this.findById(id);

    try {
      this.logger.log(`Excluindo produto ID "${id}"`);
      return await this.productsRepository.delete(id);
    } catch (error: any) {
      // Código P2003 no Prisma indica restrição de chave estrangeira (foreign key violation)
      if (error?.code === 'P2003') {
        throw new ConflictException(
          'Não é possível excluir o produto pois ele possui itens associados a pedidos existentes.',
        );
      }
      throw error;
    }
  }
}
