import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Prisma conectado com sucesso ao banco de dados PostgreSQL.');
    } catch (error) {
      this.logger.error('Falha ao conectar o Prisma ao banco de dados:', error);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Conexão do Prisma com o banco de dados encerrada.');
  }
}