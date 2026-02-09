# syntax=docker/dockerfile:1.7

FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN apk add --no-cache libc6-compat && corepack enable
WORKDIR /repo

FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY apps/cms/package.json apps/cms/package.json
COPY packages/eslint-config/package.json packages/eslint-config/package.json
COPY packages/prettier-config/package.json packages/prettier-config/package.json
COPY packages/typescript-config/package.json packages/typescript-config/package.json
RUN pnpm install --frozen-lockfile --filter ./apps/cms...

FROM base AS builder
COPY --from=deps /repo/node_modules ./node_modules
COPY --from=deps /repo/apps/cms/node_modules ./apps/cms/node_modules
COPY --from=deps /repo/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=deps /repo/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=deps /repo/package.json ./package.json
COPY --from=deps /repo/turbo.json ./turbo.json
COPY . .
ARG S3_BUCKET
ARG S3_REGION
ARG S3_ACCESS_KEY_ID
ARG S3_SECRET_ACCESS_KEY
ARG S3_ENDPOINT
ARG S3_FORCE_PATH_STYLE
ENV S3_BUCKET=$S3_BUCKET
ENV S3_REGION=$S3_REGION
ENV S3_ACCESS_KEY_ID=$S3_ACCESS_KEY_ID
ENV S3_SECRET_ACCESS_KEY=$S3_SECRET_ACCESS_KEY
ENV S3_ENDPOINT=$S3_ENDPOINT
ENV S3_FORCE_PATH_STYLE=$S3_FORCE_PATH_STYLE
RUN pnpm --filter ./apps/cms build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup -S nodejs -g 1001 && adduser -S nextjs -u 1001 -G nodejs
COPY --from=builder --chown=nextjs:nodejs /repo/apps/cms/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /repo/apps/cms/.next/static ./apps/cms/.next/static
COPY --from=builder --chown=nextjs:nodejs /repo/apps/cms/public ./apps/cms/public
USER nextjs
EXPOSE 3000
CMD ["node", "apps/cms/server.js"]
