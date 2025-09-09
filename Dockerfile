FROM oven/bun:alpine AS base

FROM base AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --production

FROM base AS runner
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run db:seed
ENV NODE_ENV=production

EXPOSE 8080
CMD ["bun", "run", "start"]