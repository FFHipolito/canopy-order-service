<p align="center">
  <img src="https://nestjs.com/img/logo-small.svg" width="100" alt="Nest Logo" />
</p>

<h1 align="center">Canopy Order Service API</h1>

<p align="center">
  <strong>API RESTful industrial de alta performance para Gerenciamento de Produtos e Pedidos</strong><br>
  Desenvolvida com Node.js, NestJS, TypeScript, Prisma ORM, PostgreSQL e Arquitetura Limpa (SOLID & DIP).
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-22.x-339933?logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/NestJS-12.x-E0234E?logo=nestjs&logoColor=white" alt="NestJS" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Prisma-6.x-2D3748?logo=prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Docker-Multi--stage-2496ED?logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/Swagger-OpenAPI%203.0-85EA2D?logo=swagger&logoColor=black" alt="Swagger" />
  <img src="https://img.shields.io/badge/Postman-Collection%20v2.1-FF6C37?logo=postman&logoColor=white" alt="Postman" />
  <a href="https://github.com/FFHipolito/canopy-order-service/actions/workflows/ci.yml"><img src="https://github.com/FFHipolito/canopy-order-service/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <img src="https://img.shields.io/badge/Tests-100%25%20Passing-brightgreen?logo=vitest&logoColor=white" alt="Tests" />
</p>

---

## 📋 Sumário

- [Visão Geral e Escopo](#-visão-geral-e-escopo)
- [Diferenciais de Engenharia](#-diferenciais-de-engenharia)
- [Arquitetura do Sistema e Princípios SOLID](#-arquitetura-do-sistema-e-princípios-solid)
- [Transações Atômicas ACID e Baixa de Estoque](#-transações-atômicas-acid-e-baixa-de-estoque)
- [Como Executar com Docker (Recomendado)](#-como-executar-com-docker-1-comando)
- [Como Executar Localmente (Desenvolvimento)](#-como-executar-localmente)
- [Execução dos Testes Automatizados](#-execução-dos-testes-automatizados)
- [Documentação da API (Swagger & Postman)](#-documentação-interativa-swagger--postman)
- [Integração Contínua (CI/CD)](#-integração-contínua-cicd)
- [Credenciais de Teste para Autenticação JWT](#-credenciais-de-teste-para-autenticação-jwt)
- [Catálogo de Endpoints da API](#-catálogo-de-endpoints-da-api)

---

## 🎯 Visão Geral e Escopo

A **Canopy Order Service** é uma API robusta projetada para atender ao gerenciamento de suprimentos industriais e florestais (como sensores IoT, válvulas hidráulicas, mudas clonadas e maquinário pesado).

### 1. Módulo de Produtos (CRUD Completo):
- **Campos:** `id` (UUID v4), `nome`, `categoria`, `descricao`, `preco`, `quantidade_estoque`, `createdAt`, `updatedAt`.
- **Validações:** Preço estritamente maior que zero (`> 0`) e quantidade de estoque não negativa (`>= 0`).
- **Filtros Dinâmicos:** Busca por nome (parcial e *case-insensitive*), categoria e faixa de preço (`precoMin`, `precoMax`).

### 2. Módulo de Pedidos (Gerenciamento e Estoque):
- **Campos:** `id` (UUID v4), `produtos` (itens contendo `productId`, `quantidade`, `precoUnitario`), `total_pedido`, `status` (`Pendente`, `Concluído`, `Cancelado`).
- **Regras Críticas:**
  - Verificação rigorosa e individual da disponibilidade de estoque antes da confirmação.
  - Baixa atômica de estoque em lote via transação ACID ao criar ou transicionar para `Concluído`.
  - Rejeição imediata (`BadRequestException`) caso o estoque seja insuficiente.
  - Estorno seguro de estoque em caso de cancelamento de pedido concluído.

---

## 💎 Diferenciais de Engenharia

| Diferencial | Implementação | Benefício Técnico |
| :--- | :--- | :--- |
| **Transação Atômica ACID** | `prisma.$transaction` callback | Elimina *race conditions* e inconsistências de estoque entre pedidos simultâneos |
| **DIP (Dependency Inversion)** | Interfaces & Abstract Classes | Desacopla 100% regras de negócio de ORMs e drivers de banco |
| **Envelope de Resposta** | `TransformInterceptor` | Formatação unificada `{ success: true, data: ..., timestamp: ... }` para clientes |
| **Filtro Global de Erros** | `HttpExceptionFilter` | Previne *Information Disclosure* ocultando stacktraces internas de banco |
| **Prevenção de Mass Assignment** | `ValidationPipe` estrito | Rejeita payloads com campos desconhecidos (`whitelist`, `forbidNonWhitelisted`) |
| **Logging de Latência** | `RequestLoggerMiddleware` | Registra `[Método] [Rota] [StatusCode] [Tempo em ms]` via evento `finish` |
| **Seed Industrial Real** | `prisma/seed.ts` | Popula o banco com itens do ecossistema florestal/industrial |

---

## 🏛️ Arquitetura do Sistema e Princípios SOLID

A aplicação adota o padrão em **3 camadas desacopladas**, aplicando o **Princípio de Inversão de Dependência (DIP)**:

```mermaid
flowchart TD
    Client(["HTTP Request (Client / Swagger)"]) --> MW["RequestLoggerMiddleware"]
    MW --> PIPE["ValidationPipe (Whitelist / DTOs)"]
    PIPE --> CTRL["Controllers (Products / Orders / Auth)"]
    CTRL --> SVC["Services (Regras de Domínio)"]
    SVC -.->|Injeção via Abstract Class| REPO_INT["Repositories Contracts (DIP)"]
    REPO_INT ==> REPO_IMPL["Prisma Concrete Repositories"]
    REPO_IMPL --> ORM["PrismaService (PostgreSQL)"]
    CTRL --> INTC["TransformInterceptor (Envelope)"]
    INTC --> ClientRes(["HTTP Response { success, data, timestamp }"])
    CTRL -.->|Exceção| FLTR["HttpExceptionFilter (Tratamento Seguro)"]
    FLTR --> ClientErr(["HTTP Error Response { success: false, ... }"])
```

### Por que Inversão de Dependência (DIP) no NestJS?
Em TypeScript, interfaces puras sofrem *type erasure* em tempo de execução. Para aplicar o DIP de forma idiomática e limpa, criamos classes abstratas como identificadores de injeção (`ProductsRepository`, `OrdersRepository`). Isso permite que os serviços dependam exclusivamente de contratos, tornando a suíte de testes unitários 100% isolada e ultrarrápida sem depender de instâncias reais de banco.

---

## 🔒 Transações Atômicas ACID e Baixa de Estoque

Ao confirmar um pedido com status `Concluído`, o sistema executa a operação sob uma transação atômica gerenciada pelo PostgreSQL:

```mermaid
sequenceDiagram
    autonumber
    actor Cliente
    participant Service as OrdersService
    participant Tx as prisma.$transaction (ACID)
    participant DB as PostgreSQL
    
    Cliente->>Service: POST /orders { produtos, status: "Concluído" }
    Service->>Service: Valida estoque disponível individualmente
    alt Estoque Insuficiente
        Service-->>Cliente: 400 Bad Request (Estoque Insuficiente)
    else Estoque Disponível
        Service->>Tx: Inicia Transação Atômica
        Tx->>DB: Verifica lock do produto
        Tx->>DB: Decrementa quantidade_estoque
        Tx->>DB: Cria registro do pedido (Order)
        Tx->>DB: Cria itens vinculados com snapshot de preço
        Tx-->>Service: Commit bem-sucedido
        Service-->>Cliente: 201 Created { success: true, data: Order }
    end
```

Se qualquer produto falhar no meio do processo ou ocorrer erro de concorrência, o PostgreSQL realiza **Rollback imediato**, garantindo que nenhum item seja abatido indevidamente.

---

## 🚀 Como Executar com Docker (1 Comando)

Toda a infraestrutura (API NestJS compilada em multi-stage + Banco de Dados PostgreSQL) pode ser inicializada com um único comando:

```bash
docker compose up --build
```

> **O que esse comando faz automaticamente?**
> 1. Constrói a imagem otimizada da API via Dockerfile multi-stage.
> 2. Inicializa o container PostgreSQL com verificação de *healthcheck*.
> 3. Aguarda o banco estar saudável (`service_healthy`).
> 4. Executa as migrações do banco (`npx prisma migrate deploy`).
> 5. Roda o seed com dados industriais/florestais pré-cadastrados (`npx prisma db seed`).
> 6. Inicia a API na porta `3000`.

Para parar os serviços:
```bash
docker compose down
```

---

## 💻 Como Executar Localmente

### Pré-requisitos
- Node.js 22+ e npm
- Instância PostgreSQL rodando (ou via docker: `docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=canopy_order_db postgres:16-alpine`)

### Passo a Passo

1. **Instalar Dependências:**
   ```bash
   npm install
   ```

2. **Configurar Variáveis de Ambiente:**
   Crie ou edite o arquivo `.env`:
   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/canopy_order_db?schema=public"
   PORT=3000
   NODE_ENV=development
   JWT_SECRET=super-secret-canopy-key-change-in-production
   JWT_EXPIRES_IN=1d
   ```

3. **Gerar o Cliente Prisma e Rodar Migrações:**
   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

4. **Popular o Banco com Seed Industrial:**
   ```bash
   npm run prisma:seed
   ```

5. **Iniciar a Aplicação em Modo Desenvolvimento:**
   ```bash
   npm run start:dev
   ```

---

## 🧪 Execução dos Testes Automatizados

A suíte de testes foi construída com Vitest e foca em 100% de cobertura nos caminhos críticos de negócio:

```bash
# Executa todos os testes unitários
npm test

# Executa os testes com relatório detalhado de cobertura
npm run test:cov
```

**Resultado de Cobertura:**
- **76 testes unitários** executados em 15 arquivos de teste (`vitest`).
- **100% de cobertura** em declarações (`Stmts`), funções (`Funcs`) e linhas (`Lines`) cobrindo todas as camadas: Services, Controllers, Repositories, Guards, Interceptors, Filtros e Middlewares.

---

## 📚 Documentação Interativa (Swagger & Postman)

### 1. Swagger OpenAPI 3.0 (Navegador)
Com a aplicação em execução, acesse a documentação interativa OpenAPI 3.0 no navegador:

👉 **[http://localhost:3000/api/docs](http://localhost:3000/api/docs)**

- **Schemas completos**: visualização de modelos de entrada (DTOs) e payloads de resposta envelope.
- **Autenticação integrada**: clique em **Authorize** e cole o token JWT gerado em `/auth/login`.

### 2. Coleção Oficial do Postman
Para testes rápidos via Postman, o repositório inclui uma coleção completa v2.1.0 pré-configurada:

📁 Arquivo: [`postman/canopy-order-service.postman_collection.json`](postman/canopy-order-service.postman_collection.json)

- **Test Scripts inclusos**: ao disparar `POST /auth/login`, o token JWT é capturado e gravado na variável `{{jwt_token}}` automaticamente.
- **Encadeamento de IDs**: ao criar um produto ou pedido, o identificador retornado é salvo nas variáveis `{{productId}}` e `{{orderId}}` para uso imediato nas rotas subsequentes.

---

## ⚙️ Integração Contínua (CI/CD)

O projeto conta com um pipeline automatizado de **GitHub Actions** em [`.github/workflows/ci.yml`](.github/workflows/ci.yml) executado a cada push ou pull request na branch `main`:

1. **Instalação determinística**: `npm ci`
2. **Geração de tipos do Prisma**: `npx prisma generate`
3. **Análise estática (Linting)**: `npm run lint` com `oxlint`
4. **Compilação TypeScript**: `npm run build` com `nest build`
5. **Suíte de Testes Unitários**: `npm test` garantindo regressão zero

---

## 🔑 Credenciais de Teste para Autenticação JWT

Para testar endpoints protegidos ou interagir com o Swagger:

| Campo | Valor de Teste |
| :--- | :--- |
| **Endpoint de Login** | `POST /auth/login` |
| **E-mail** | `admin@canopy.com.br` |
| **Senha** | `Canopy#2026` |
| **Duração do Token** | `24 horas` |

---

## 📡 Catálogo de Endpoints da API

### Autenticação
| Método | Rota | Descrição | Auth |
| :--- | :--- | :--- | :---: |
| `POST` | `/auth/login` | Gera o token JWT para autenticação | Pública |
| `GET` | `/auth/profile` | Retorna os dados do usuário autenticado | Bearer JWT |

### Produtos
| Método | Rota | Descrição | Auth |
| :--- | :--- | :--- | :---: |
| `POST` | `/products` | Cadastra novo produto com validação de preço e estoque | Pública |
| `GET` | `/products` | Lista produtos com filtros (`nome`, `categoria`, `precoMin`, `precoMax`) | Pública |
| `GET` | `/products/:id` | Recupera produto por UUID v4 | Pública |
| `PATCH` | `/products/:id` | Atualiza parcialmente dados de um produto | Pública |
| `DELETE` | `/products/:id` | Remove produto com verificação de integridade referencial | Pública |

### Pedidos
| Método | Rota | Descrição | Auth |
| :--- | :--- | :--- | :---: |
| `POST` | `/orders` | Cria pedido com validação individual e baixa atômica | Pública |
| `GET` | `/orders` | Lista histórico completo de pedidos e itens | Pública |
| `GET` | `/orders/:id` | Recupera pedido por UUID com detalhes dos produtos | Pública |
| `PATCH` | `/orders/:id/status` | Altera status (`Concluído`, `Cancelado`) com controle atômico de estoque | Pública |

---
