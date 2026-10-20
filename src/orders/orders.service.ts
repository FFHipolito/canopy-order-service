import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import { ProductsRepository } from '../products/repositories/products.repository.interface.js';
import type { CreateOrderDto } from './dto/create-order.dto.js';
import type { UpdateOrderStatusDto } from './dto/update-order-status.dto.js';
import {
  OrdersRepository,
  type OrderWithRelations,
  type PreparedOrderItem,
} from './repositories/orders.repository.interface.js';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly ordersRepository: OrdersRepository,
    private readonly productsRepository: ProductsRepository,
  ) {}

  async create(createOrderDto: CreateOrderDto): Promise<OrderWithRelations> {
    const { produtos, status = OrderStatus.PENDENTE } = createOrderDto;

    // 1. Consolida itens duplicados caso o cliente envie o mesmo productId mais de uma vez
    const consolidatedItemsMap = new Map<string, number>();
    for (const item of produtos) {
      const currentQty = consolidatedItemsMap.get(item.productId) ?? 0;
      consolidatedItemsMap.set(item.productId, currentQty + item.quantidade);
    }

    const uniqueProductIds = Array.from(consolidatedItemsMap.keys());

    // 2. Busca todos os produtos correspondentes no banco
    const foundProducts = await this.productsRepository.findByIds(uniqueProductIds);
    const productMap = new Map(foundProducts.map((p) => [p.id, p]));

    // 3. Validação de existência e verificação individual de disponibilidade em estoque
    const preparedItems: PreparedOrderItem[] = [];
    let totalAcumulado = new Prisma.Decimal(0);

    for (const [productId, quantidade] of consolidatedItemsMap.entries()) {
      const product = productMap.get(productId);

      if (!product) {
        throw new NotFoundException(
          `Produto com ID "${productId}" não foi encontrado no catálogo.`,
        );
      }

      // Regra de negócio crítica: verificar disponibilidade individual em estoque
      if (product.quantidade_estoque < quantidade) {
        throw new BadRequestException(
          `Estoque insuficiente para o produto "${product.nome}". Solicitado: ${quantidade}, Disponível: ${product.quantidade_estoque}.`,
        );
      }

      const precoUnitario = product.preco;
      const subtotal = precoUnitario.mul(quantidade);
      totalAcumulado = totalAcumulado.add(subtotal);

      preparedItems.push({
        productId,
        quantidade,
        precoUnitario,
      });
    }

    const shouldDecrementStock = status === OrderStatus.CONCLUIDO;

    this.logger.log(
      `Criando pedido com ${preparedItems.length} produto(s). Total: R$ ${totalAcumulado.toFixed(2)}. Status: ${status}`,
    );

    // 4. Executa criação atômica no banco com baixa de estoque se status for Concluído
    return this.ordersRepository.createOrderInTransaction(
      preparedItems,
      totalAcumulado,
      status,
      shouldDecrementStock,
    );
  }

  async findAll(): Promise<OrderWithRelations[]> {
    return this.ordersRepository.findAll();
  }

  async findById(id: string): Promise<OrderWithRelations> {
    const order = await this.ordersRepository.findById(id);
    if (!order) {
      throw new NotFoundException(`Pedido com ID "${id}" não encontrado.`);
    }
    return order;
  }

  async updateStatus(
    id: string,
    updateStatusDto: UpdateOrderStatusDto,
  ): Promise<OrderWithRelations> {
    const order = await this.findById(id);
    const novoStatus = updateStatusDto.status;

    // Idempotência: status já é o solicitado
    if (order.status === novoStatus) {
      return order;
    }

    this.logger.log(
      `Transição de status do pedido ${id}: "${order.status}" -> "${novoStatus}"`,
    );

    switch (novoStatus) {
      case OrderStatus.CONCLUIDO: {
        if (order.status === OrderStatus.CANCELADO) {
          throw new BadRequestException(
            'Não é permitido concluir um pedido que já se encontra cancelado.',
          );
        }
        // Abater estoque atomicamente na conclusão
        return this.ordersRepository.completeOrderInTransaction(order);
      }

      case OrderStatus.CANCELADO: {
        // Se já estava concluído, estorna o estoque; se estava pendente, não há estorno
        const shouldRestock = order.status === OrderStatus.CONCLUIDO;
        return this.ordersRepository.cancelOrderInTransaction(order, shouldRestock);
      }

      case OrderStatus.PENDENTE: {
        if (order.status === OrderStatus.CONCLUIDO) {
          throw new BadRequestException(
            'Não é permitido reverter um pedido já concluído para o status pendente.',
          );
        }
        // Se veio de cancelado para pendente, apenas atualiza
        return this.ordersRepository.cancelOrderInTransaction(order, false);
      }

      default:
        throw new BadRequestException(`Status inválido: ${String(novoStatus)}`);
    }
  }
}
