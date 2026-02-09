# syntax=docker/dockerfile:1.7

FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN apk add --no-cache libc6-compat && corepack enable
WORKDIR /repo

FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY apps/docs/package.json apps/docs/package.json
COPY packages/docs-source/package.json packages/docs-source/package.json
COPY packages/eslint-config/package.json packages/eslint-config/package.json
COPY packages/prettier-config/package.json packages/prettier-config/package.json
COPY packages/typescript-config/package.json packages/typescript-config/package.json
COPY packages/ui/package.json packages/ui/package.json
RUN pnpm install --frozen-lockfile --filter ./apps/docs...

FROM base AS builder
COPY --from=deps /repo/node_modules ./node_modules
COPY --from=deps /repo/apps/docs/node_modules ./apps/docs/node_modules
COPY --from=deps /repo/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=deps /repo/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=deps /repo/package.json ./package.json
COPY --from=deps /repo/turbo.json ./turbo.json
COPY . .
RUN mkdir -p apps/docs/public
ARG DOCS_CMS_URL=http://cms:3000
ARG DOCS_ALLOW_LOCAL_IP=true
ENV DOCS_CMS_URL=$DOCS_CMS_URL
ENV DOCS_ALLOW_LOCAL_IP=$DOCS_ALLOW_LOCAL_IP
RUN pnpm --filter ./apps/docs build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3001
RUN addgroup -S nodejs -g 1001 && adduser -S nextjs -u 1001 -G nodejs
COPY --from=builder --chown=nextjs:nodejs /repo/apps/docs/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /repo/apps/docs/.next/static ./apps/docs/.next/static
COPY --from=builder --chown=nextjs:nodejs /repo/apps/docs/public ./apps/docs/public
USER nextjs
EXPOSE 3001
CMD ["node", "apps/docs/server.js"]
