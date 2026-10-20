import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { ProductsModule } from '../products/products.module.js';
import { OrdersController } from './orders.controller.js';
import { OrdersService } from './orders.service.js';
import { PrismaOrdersRepository } from './repositories/prisma-orders.repository.js';
import { OrdersRepository } from './repositories/orders.repository.interface.js';

@Module({
  imports: [PrismaModule, ProductsModule],
  controllers: [OrdersController],
  providers: [
    OrdersService,
    {
      provide: OrdersRepository,
      useClass: PrismaOrdersRepository,
    },
  ],
  exports: [OrdersService, OrdersRepository],
})
export class OrdersModule {}
