# ─── Stage 1: deps ───────────────────────────────────────────
FROM node:22-slim AS deps
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts

# ─── Stage 2: builder ────────────────────────────────────────
FROM node:22-slim AS builder
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npx prisma generate

# NEXT_PUBLIC_* 는 빌드 타임에 클라이언트 번들로 인라인되므로 build arg 로 주입
ARG NEXT_PUBLIC_TOSS_CLIENT_KEY
ENV NEXT_PUBLIC_TOSS_CLIENT_KEY=$NEXT_PUBLIC_TOSS_CLIENT_KEY

ENV NEXT_TELEMETRY_DISABLED=1
RUN mkdir -p public && npm run build

# ─── Stage 3: runner ─────────────────────────────────────────
FROM node:22-slim AS runner
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOME=/app

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs --home /app --no-create-home

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma

USER nextjs

EXPOSE 3002
ENV PORT=3002
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
