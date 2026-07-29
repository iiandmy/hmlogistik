# =============================================================================
# STAGE 1: Installer — install ALL dependencies (including devDependencies)
# =============================================================================
FROM node:22-alpine AS installer

WORKDIR /app

# Copy root dependency manifests (layer caching)
COPY package.json yarn.lock ./
COPY turbo.json ./

# Copy ALL workspace package.json files so `yarn install` resolves workspaces
COPY apps/web/package.json apps/web/package.json
COPY apps/api/package.json apps/api/package.json
COPY packages/database/package.json packages/database/package.json
COPY packages/eslint-config/package.json packages/eslint-config/package.json

# Install dependencies (frozen-lockfile ensures reproducible builds)
RUN yarn install --frozen-lockfile --production=false

# =============================================================================
# STAGE 2: Builder — build workspace dependencies + API
# =============================================================================
FROM installer AS builder

WORKDIR /app

# Copy all source files (excluding patterns listed in .dockerignore)
COPY . .

# DATABASE_URL build arg — required by Prisma generate during build.
# It does NOT need to point to a real database; Prisma only needs the schema
# file to generate the client. A placeholder is sufficient.
ARG DATABASE_URL

# Create a temporary .env so Prisma generate can read DATABASE_URL,
# then remove it after build to avoid leaking secrets into the image layer.
RUN echo "DATABASE_URL=$DATABASE_URL" > .env && \
    yarn workspace @hmlogistik/database build && \
    rm .env

# Build the NestJS API (tsc compilation via nest build)
RUN yarn workspace api build

# =============================================================================
# STAGE 3: Runner — run the compiled NestJS API
# =============================================================================
FROM node:22-alpine AS runner

WORKDIR /app

# Create a non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# ── Copy built artifacts from builder ──────────────────────────────────────

# Compiled API output
COPY --from=builder /app/apps/api/dist ./dist

# Compiled database package (Prisma client + types)
COPY --from=builder /app/packages/database/dist ./packages/database/dist

# Prisma schema, migrations & config (needed at runtime for migrate deploy)
COPY --from=builder /app/packages/database/prisma/migrations ./packages/database/prisma/migrations
COPY --from=builder /app/packages/database/prisma/schema.prisma ./packages/database/prisma/schema.prisma
COPY --from=builder /app/packages/database/prisma.config.ts ./packages/database/prisma.config.ts
COPY --from=builder /app/packages/database/package.json ./packages/database/package.json

# Prisma-generated client (output = "./generated" in schema.prisma)
COPY --from=builder /app/packages/database/prisma/generated ./packages/database/prisma/generated

# Prisma npm packages (runtime dependencies: @prisma/client, @prisma/adapter-pg)
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# API package.json (used by yarn for production dependency resolution)
COPY --from=builder /app/apps/api/package.json ./package.json

# ── Install production dependencies only ───────────────────────────────────
RUN yarn install --frozen-lockfile --production=true

# Install Prisma CLI globally so we can run migrations at runtime
# (prisma is a devDependency of @hmlogistik/database, not included in --production)
RUN npm install -g prisma@^7.9.0

# Drop root privileges
USER appuser

EXPOSE 3000

CMD ["node", "dist/main"]