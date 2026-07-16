FROM node:22-alpine AS base

# ── DEPS ──────────────────────────────────────────────────────────────────────
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# ── BUILDER ───────────────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# ── RUNNER ────────────────────────────────────────────────────────────────────
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser  --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/vault.config.js ./vault.config.js
COPY --from=builder /app/node_modules/.prisma  ./node_modules/.prisma
# full deps tree, not a hand-picked subset — prisma's CLI has a deep internal
# dependency chain (@prisma/config -> effect -> fast-check -> ...) that shifts
# between versions; curating individual subpaths breaks on every bump
COPY --from=deps /app/node_modules ./node_modules

# DB and vault directories will be volume-mounted
RUN mkdir -p /data && chown nextjs:nodejs /data

USER nextjs

EXPOSE 3005
ENV PORT=3005
ENV HOSTNAME="0.0.0.0"

# Run migrations then start
CMD ["sh", "-c", "node node_modules/prisma/build/index.js db push --skip-generate && node server.js"]
