# ==============================================================================
# Multi-Stage Dockerfile para Produção (NestJS + Prisma + Node.js 22 Alpine)
# ==============================================================================

# ------------------------------------------------------------------------------
# Estágio 1: Build da Aplicação
# ------------------------------------------------------------------------------
FROM node:22-alpine AS builder

WORKDIR /app

# Dependências nativas necessárias para o motor do Prisma no Alpine Linux
RUN apk add --no-cache openssl libc6-compat

# Copia os manifestos de dependência
COPY package*.json ./
COPY prisma ./prisma/

# Instalação limpa e reprodutível das dependências
RUN npm ci

# Geração dos tipos e cliente estático do Prisma
RUN npx prisma generate

# Copia arquivos de build e código-fonte
COPY tsconfig*.json nest-cli.json ./
COPY src ./src

# Compilação do TypeScript para JavaScript (dist/)
RUN npm run build

# ------------------------------------------------------------------------------
# Estágio 2: Imagem Final de Execução (Otimizada e Segura)
# ------------------------------------------------------------------------------
FROM node:22-alpine AS runner

WORKDIR /app

# Dependências de runtime para o Prisma
RUN apk add --no-cache openssl libc6-compat

ENV NODE_ENV=production
ENV PORT=3000

# Copia os arquivos de configuração, cliente prisma, dependências e bundle compilado
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Usuário não-root para atender às melhores práticas de segurança (Least Privilege)
RUN chown -R node:node /app
USER node

EXPOSE 3000

# Executa migrações pendentes e inicia o servidor HTTP
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
