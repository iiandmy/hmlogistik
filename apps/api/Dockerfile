# =============================================================================
# Stage 1: Build
# =============================================================================
FROM node:22-alpine AS builder
WORKDIR /app

# ---------- Dependencies ----------
# Copy all workspace package.json files so yarn can resolve workspace deps
COPY package.json yarn.lock ./
COPY apps/api/package.json apps/api/tsconfig.json apps/api/tsconfig.build.json apps/api/nest-cli.json apps/api/
COPY packages/database/package.json packages/database/tsconfig.json packages/database/prisma.config.ts packages/database/
COPY packages/eslint-config/package.json packages/eslint-config/

RUN yarn install --frozen-lockfile

# ---------- Build @hmlogistik/database ----------
# prisma generate reads the schema (no DB connection needed)
# tsc -b uses composite mode from tsconfig.json
COPY packages/database/prisma ./packages/database/prisma
COPY packages/database/index.ts ./packages/database/index.ts

RUN npx prisma generate --schema=packages/database/prisma/schema.prisma \
 && npx tsc -b packages/database

# ---------- Build API ----------
COPY apps/api/src ./apps/api/src

RUN yarn workspace api build

# =============================================================================
# Stage 2: Production image
# =============================================================================
FROM node:22-alpine
WORKDIR /app

# Copy compiled output
COPY --from=builder /app/apps/api/dist ./apps/api/dist

# Copy package.json for NestJS module resolution
COPY --from=builder /app/apps/api/package.json ./apps/api/

# Copy compiled database package (needed at runtime for Prisma client)
COPY --from=builder /app/packages/database/package.json ./packages/database/
COPY --from=builder /app/packages/database/dist ./packages/database/dist
COPY --from=builder /app/packages/database/prisma/generated ./packages/database/prisma/generated

# Copy node_modules (production deps only)
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000
CMD ["node", "apps/api/dist/main.js"]
