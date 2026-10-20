import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto.js';
import { OrderEntity } from './entities/order.entity.js';
import { OrdersService } from './orders.service.js';

@ApiTags('Pedidos')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Criar um novo pedido de compra',
    description:
      'Registra um pedido validando a disponibilidade individual de estoque de cada item. Se criado com status CONCLUIDO, o estoque é abatido atomicamente.',
  })
  @ApiCreatedResponse({
    description: 'Pedido registrado com sucesso.',
    type: OrderEntity,
  })
  @ApiBadRequestResponse({
    description:
      'Estoque insuficiente para um ou mais produtos ou payload inválido.',
  })
  @ApiNotFoundResponse({
    description: 'Um ou mais produtos informados não existem no catálogo.',
  })
  async create(@Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(createOrderDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Listar todos os pedidos',
    description:
      'Retorna o histórico de pedidos contendo todos os itens e preços unitários calculados.',
  })
  @ApiOkResponse({
    description: 'Lista de pedidos obtida com sucesso.',
    type: [OrderEntity],
  })
  async findAll() {
    return this.ordersService.findAll();
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Buscar pedido por ID',
    description:
      'Recupera os detalhes completos de um pedido específico pelo seu UUID.',
  })
  @ApiParam({
    name: 'id',
    description: 'Identificador único do pedido (UUID v4)',
    example: 'c2b5d480-1a1a-4c4f-9e6b-7c70f3f3e111',
  })
  @ApiOkResponse({
    description: 'Pedido encontrado com sucesso.',
    type: OrderEntity,
  })
  @ApiNotFoundResponse({
    description: 'Pedido não encontrado para o ID especificado.',
  })
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.ordersService.findById(id);
  }

  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Atualizar o status de um pedido',
    description:
      'Altera o status do pedido (Pendente, Concluído, Cancelado). Ao concluir, o estoque é abatido atomicamente. Ao cancelar um pedido previamente concluído, o estoque é estornado.',
  })
  @ApiParam({
    name: 'id',
    description: 'Identificador único do pedido (UUID v4)',
    example: 'c2b5d480-1a1a-4c4f-9e6b-7c70f3f3e111',
  })
  @ApiOkResponse({
    description: 'Status do pedido atualizado com sucesso.',
    type: OrderEntity,
  })
  @ApiBadRequestResponse({
    description:
      'Transição de status inválida ou estoque insuficiente ao tentar concluir.',
  })
  @ApiNotFoundResponse({
    description: 'Pedido não encontrado para o ID especificado.',
  })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateStatusDto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, updateStatusDto);
  }
}
