# =============================================================================
# Zentro-ZIMS Frontend — Cloud Run Dockerfile
# =============================================================================
# Next.js 16 with App Router, output: standalone
#
# Build:
#   docker build -t zims-web .
# Deploy:
#   gcloud run deploy zims-web --source . --region=asia-southeast1
# =============================================================================

FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time environment variables
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=8080

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# public/ is optional — Next.js standalone works without it
RUN mkdir -p ./public

USER nextjs

EXPOSE 8080

ENV HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]
