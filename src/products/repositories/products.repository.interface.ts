import type { Product } from '@prisma/client';
import type { CreateProductDto } from '../dto/create-product.dto.js';
import type { UpdateProductDto } from '../dto/update-product.dto.js';
import type { FilterProductsDto } from '../dto/filter-products.dto.js';

export interface IProductsRepository {
  create(data: CreateProductDto): Promise<Product>;
  findAll(filters?: FilterProductsDto): Promise<Product[]>;
  findById(id: string): Promise<Product | null>;
  findByIds(ids: string[]): Promise<Product[]>;
  update(id: string, data: UpdateProductDto): Promise<Product>;
  delete(id: string): Promise<Product>;
}

export abstract class ProductsRepository implements IProductsRepository {
  abstract create(data: CreateProductDto): Promise<Product>;
  abstract findAll(filters?: FilterProductsDto): Promise<Product[]>;
  abstract findById(id: string): Promise<Product | null>;
  abstract findByIds(ids: string[]): Promise<Product[]>;
  abstract update(id: string, data: UpdateProductDto): Promise<Product>;
  abstract delete(id: string): Promise<Product>;
}
