# Dependências
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copiar package files e instalar dependências
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# Build do projeto
FROM node:22-alpine AS builder
WORKDIR /app

# Receber argumentos de build
ARG DB_HOST
ARG DB_USER
ARG DB_PASSWORD
ARG DB_NAME
ARG DB_PORT
ARG DATABASE_URL
ARG SYNC_SECRET
ARG CONNECT_SKILLS_URL
ARG NEXT_PUBLIC_BASE_URL
ARG NEXT_PUBLIC_CONNECT_SKILLS_URL
ARG APP_ID
ARG NEXT_PUBLIC_APP_ID
ARG GIT_SHA

# Definir as variáveis de ambiente necessárias para o build
ENV DB_HOST=$DB_HOST
ENV DB_USER=$DB_USER
ENV DB_PASSWORD=$DB_PASSWORD
ENV DB_NAME=$DB_NAME
ENV DB_PORT=$DB_PORT
ENV DATABASE_URL=$DATABASE_URL
ENV SYNC_SECRET=$SYNC_SECRET
ENV CONNECT_SKILLS_URL=$CONNECT_SKILLS_URL
ENV NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL
ENV NEXT_PUBLIC_CONNECT_SKILLS_URL=$NEXT_PUBLIC_CONNECT_SKILLS_URL
ENV APP_ID=$APP_ID
ENV NEXT_PUBLIC_APP_ID=$NEXT_PUBLIC_APP_ID
ENV GIT_SHA=$GIT_SHA

ENV NEXT_TELEMETRY_DISABLED 1

# Copiar dependências instaladas e o código fonte
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Gerar o cliente do Prisma
RUN npx prisma generate

# Executar o build do Next.js
RUN npm run build

# Imagem de produção
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED 1

# Definir as variáveis de ambiente necessárias em runtime
ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar arquivos públicos e estáticos gerados no build standalone
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma

# Definir permissões corretas
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

# Iniciar o servidor standalone gerado pelo Next.js
CMD ["node", "server.js"]
