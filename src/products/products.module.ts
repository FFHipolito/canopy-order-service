import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { ProductsController } from './products.controller.js';
import { ProductsService } from './products.service.js';
import { PrismaProductsRepository } from './repositories/prisma-products.repository.js';
import { ProductsRepository } from './repositories/products.repository.interface.js';

@Module({
  imports: [PrismaModule],
  controllers: [ProductsController],
  providers: [
    ProductsService,
    {
      provide: ProductsRepository,
      useClass: PrismaProductsRepository,
    },
  ],
  exports: [ProductsService, ProductsRepository],
})
export class ProductsModule {}
