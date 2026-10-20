import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';
import { TransformInterceptor } from './common/interceptors/transform.interceptor.js';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // 1. Habilitação de CORS para integração com frontends modernos
  app.enableCors();

  // 2. Pipes globais de validação com proteção contra Mass Assignment
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // 3. Interceptor global para envelope de resposta padronizado
  app.useGlobalInterceptors(new TransformInterceptor());

  // 4. Filtro global de exceções contra vazamento de stacktrace do banco
  app.useGlobalFilters(new HttpExceptionFilter());

  // 5. Configuração da documentação interativa OpenAPI 3.0 (Swagger)
  const config = new DocumentBuilder()
    .setTitle('Canopy Order Service API')
    .setDescription(
      'API RESTful industrial para Gerenciamento de Produtos e Pedidos com Transações Atômicas ACID e Arquitetura Limpa.',
    )
    .setVersion('1.0.0')
    .addTag('Autenticação', 'Autenticação JWT e perfil de usuário')
    .addTag('Produtos', 'CRUD completo de produtos e controle de estoque')
    .addTag('Pedidos', 'Gerenciamento de pedidos e baixa atômica de estoque')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Insira o token JWT obtido no endpoint /auth/login',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
    customSiteTitle: 'Canopy API Docs',
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  logger.log(`🚀 Aplicação executando na porta: ${port}`);
  logger.log(`📚 Documentação Swagger interativa: http://localhost:${port}/api/docs`);
}

await bootstrap();
