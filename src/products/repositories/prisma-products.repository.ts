import { Injectable } from '@nestjs/common';
import { Prisma, type Product } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { CreateProductDto } from '../dto/create-product.dto.js';
import type { FilterProductsDto } from '../dto/filter-products.dto.js';
import type { UpdateProductDto } from '../dto/update-product.dto.js';
import { ProductsRepository } from './products.repository.interface.js';

@Injectable()
export class PrismaProductsRepository implements ProductsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateProductDto): Promise<Product> {
    return this.prisma.product.create({
      data: {
        nome: data.nome,
        categoria: data.categoria,
        descricao: data.descricao ?? null,
        preco: new Prisma.Decimal(data.preco),
        quantidade_estoque: data.quantidade_estoque,
      },
    });
  }

  async findAll(filters?: FilterProductsDto): Promise<Product[]> {
    const where: Prisma.ProductWhereInput = {};

    if (filters?.nome) {
      where.nome = {
        contains: filters.nome,
        mode: 'insensitive',
      };
    }

    if (filters?.categoria) {
      where.categoria = {
        contains: filters.categoria,
        mode: 'insensitive',
      };
    }

    if (filters?.precoMin !== undefined || filters?.precoMax !== undefined) {
      where.preco = {};
      if (filters.precoMin !== undefined) {
        where.preco.gte = new Prisma.Decimal(filters.precoMin);
      }
      if (filters.precoMax !== undefined) {
        where.preco.lte = new Prisma.Decimal(filters.precoMax);
      }
    }

    return this.prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string): Promise<Product | null> {
    return this.prisma.product.findUnique({
      where: { id },
    });
  }

  async findByIds(ids: string[]): Promise<Product[]> {
    return this.prisma.product.findMany({
      where: {
        id: { in: ids },
      },
    });
  }

  async update(id: string, data: UpdateProductDto): Promise<Product> {
    const updateData: Prisma.ProductUpdateInput = {};

    if (data.nome !== undefined) updateData.nome = data.nome;
    if (data.categoria !== undefined) updateData.categoria = data.categoria;
    if (data.descricao !== undefined) updateData.descricao = data.descricao;
    if (data.preco !== undefined) updateData.preco = new Prisma.Decimal(data.preco);
    if (data.quantidade_estoque !== undefined) {
      updateData.quantidade_estoque = data.quantidade_estoque;
    }

    return this.prisma.product.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: string): Promise<Product> {
    return this.prisma.product.delete({
      where: { id },
    });
  }
}
