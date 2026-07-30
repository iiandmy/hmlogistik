FROM node:22-bookworm-slim AS base

RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare yarn@1.22.22 --activate

WORKDIR /app

COPY package.json yarn.lock turbo.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/database/package.json packages/database/package.json
COPY packages/eslint-config/package.json packages/eslint-config/package.json

RUN yarn install --frozen-lockfile

FROM base AS builder

ARG DATABASE_URL=postgresql://postgres:postgres@localhost:5432/hmlogistik

COPY . .

RUN printf 'DATABASE_URL=%s\n' "$DATABASE_URL" > .env \
    && yarn workspace @hmlogistik/database build \
    && yarn workspace web build \
    && rm .env

FROM caddy:2.10.2-alpine AS runner

COPY --from=builder /app/apps/web/dist /srv
COPY apps/web/Caddyfile /etc/caddy/Caddyfile

EXPOSE 80 443
