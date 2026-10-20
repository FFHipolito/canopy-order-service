import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CreateProductDto } from './dto/create-product.dto.js';
import { FilterProductsDto } from './dto/filter-products.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { ProductEntity } from './entities/product.entity.js';
import { ProductsService } from './products.service.js';

@ApiTags('Produtos')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Cadastrar um novo produto',
    description: 'Cria um novo produto no catálogo garantindo validação de preço positivo e estoque não negativo.',
  })
  @ApiCreatedResponse({
    description: 'Produto criado com sucesso no catálogo.',
    type: ProductEntity,
  })
  @ApiBadRequestResponse({
    description: 'Dados inválidos fornecidos no payload (ex: preço negativo ou campos vazios).',
  })
  async create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Listar produtos com suporte a filtros dinâmicos',
    description: 'Retorna a lista de produtos cadastrados. Permite filtros opcionais por nome, categoria e faixa de preço.',
  })
  @ApiOkResponse({
    description: 'Lista de produtos retornada com sucesso.',
    type: [ProductEntity],
  })
  async findAll(@Query() filters: FilterProductsDto) {
    return this.productsService.findAll(filters);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Buscar produto por ID',
    description: 'Recupera os detalhes de um produto específico através do seu identificador UUID.',
  })
  @ApiParam({
    name: 'id',
    description: 'Identificador único do produto (UUID v4)',
    example: 'd9b7a480-1a1a-4c4f-9e6b-7c70f3f3e1a0',
  })
  @ApiOkResponse({
    description: 'Produto encontrado com sucesso.',
    type: ProductEntity,
  })
  @ApiNotFoundResponse({
    description: 'Produto não encontrado para o ID especificado.',
  })
  @ApiBadRequestResponse({
    description: 'ID fornecido não é um UUID v4 válido.',
  })
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.findById(id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Atualizar dados de um produto',
    description: 'Atualiza parcialmente as informações de um produto existente.',
  })
  @ApiParam({
    name: 'id',
    description: 'Identificador único do produto (UUID v4)',
    example: 'd9b7a480-1a1a-4c4f-9e6b-7c70f3f3e1a0',
  })
  @ApiOkResponse({
    description: 'Produto atualizado com sucesso.',
    type: ProductEntity,
  })
  @ApiNotFoundResponse({
    description: 'Produto não encontrado para o ID especificado.',
  })
  @ApiBadRequestResponse({
    description: 'Dados inválidos fornecidos ou formato de ID incorreto.',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productsService.update(id, updateProductDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Excluir um produto do catálogo',
    description: 'Remove um produto do catálogo caso não haja dependência de pedidos associados.',
  })
  @ApiParam({
    name: 'id',
    description: 'Identificador único do produto (UUID v4)',
    example: 'd9b7a480-1a1a-4c4f-9e6b-7c70f3f3e1a0',
  })
  @ApiNoContentResponse({
    description: 'Produto excluído com sucesso.',
  })
  @ApiNotFoundResponse({
    description: 'Produto não encontrado para o ID especificado.',
  })
  @ApiConflictResponse({
    description: 'Produto não pode ser excluído pois está associado a pedidos existentes.',
  })
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    await this.productsService.delete(id);
  }
}
