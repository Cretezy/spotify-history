FROM node:24-alpine AS base


# All dependencies
FROM base AS deps
WORKDIR /app

# Copy workspace files
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./
COPY lib/package.json ./lib/
COPY web/package.json ./web/
COPY worker/package.json ./worker/

# Install all dependencies
RUN corepack enable pnpm && pnpm install --frozen-lockfile


# Dependencies for production
FROM base AS deps_prod
WORKDIR /app

# Copy workspace files
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./
COPY lib/package.json ./lib/
COPY worker/package.json ./worker/

# Install production dependencies
RUN corepack enable pnpm && pnpm install --prod --frozen-lockfile


# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Copy all source code
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./
COPY lib/ ./lib/
COPY web/ ./web/
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/lib/node_modules ./lib/node_modules
COPY --from=deps /app/web/node_modules ./web/node_modules

# Build packages
RUN corepack enable pnpm && pnpm --filter web build


# Production image, copy all the files and run
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY package.json pnpm-workspace.yaml* ./
RUN corepack enable pnpm && corepack prepare

# Copy necessary files
COPY --from=builder /app/web/.next/standalone ./
COPY --from=builder /app/web/.next/static ./web/.next/static
COPY worker ./worker
COPY lib ./lib
COPY --from=deps_prod /app/node_modules ./node_modules
COPY --from=deps_prod /app/lib/node_modules ./lib/node_modules
COPY --from=deps_prod /app/worker/node_modules ./worker/node_modules

# Copy startup script
COPY start.sh ./
RUN chmod +x start.sh

RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["./start.sh"]
