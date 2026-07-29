# Production Deployment Plan — HM Logistik

## Overview

Deploy the HM Logistik monorepo (NestJS API + Vite React frontend + Prisma/Postgres + MinIO) to a **DigitalOcean Droplet** using **Docker Compose** with **Caddy** as the reverse proxy for automatic SSL via Let's Encrypt.

---

## Architecture

```mermaid
flowchart TB
    subgraph Internet
        User[User Browser]
    end

    subgraph "DigitalOcean Droplet"
        subgraph "Docker Compose Network"
            Caddy[Caddy<br/>:80 / :443]
            Web[Nginx:alpine<br/>serves static SPA]
            API[NestJS API<br/>:3000]
            DB[PostgreSQL 17<br/>:5432]
            MinIO[MinIO<br/>:9000 / :9001]
        end
    end

    User -->|HTTPS| Caddy
    Caddy -->|/api/*| API
    Caddy -->|/*| Web
    API --> DB
    API --> MinIO
```

### Request Flow

1. User hits `https://hmlogistik.com` (or your domain)
2. **Caddy** terminates SSL, proxies:
   - `/api/*` → NestJS API (`api:3000`)
   - `/*` → Nginx serving the SPA (`web:80`)
3. **NestJS API** connects to:
   - **PostgreSQL** for data persistence
   - **MinIO** for file storage (transfer attachments)

---

## Services Breakdown

| Service | Image | Port (internal) | Port (external) | Purpose |
|---------|-------|-----------------|-----------------|---------|
| `caddy` | `caddy:2-alpine` | 80, 443 | 80, 443 | Reverse proxy + automatic SSL |
| `web` | custom (`apps/web/Dockerfile`) | 80 | — | Serves built SPA via nginx:alpine |
| `api` | custom (`apps/api/Dockerfile`) | 3000 | — | NestJS backend |
| `postgres` | `postgres:17-alpine` | 5432 | — | Database |
| `minio` | `minio/minio:latest` | 9000, 9001 | — | Object storage for files |

---

## Files to Create / Modify

### 1. Fix: [`apps/web/Dockerfile`](../apps/web/Dockerfile)

**Issues found:**
- The `builder` stage copies the entire monorepo (`.`) which includes `node_modules` from the host — but `.dockerignore` excludes `node_modules`, so this is fine.
- However, the `RUN yarn workspace @hmlogistik/database build` step requires a `.env` file with `DATABASE_URL` for Prisma generate. In the builder stage, there's no `.env` file, so Prisma generate will fail.

**Fix:** Add a `DATABASE_URL` build argument or create a minimal `.env` for the build stage. The cleanest approach: pass `DATABASE_URL` as a build arg so Prisma can generate the client during build.

**Changes needed:**
- Add `ARG DATABASE_URL` before the build steps
- Create a minimal `.env` file with `DATABASE_URL=$DATABASE_URL` before running database build
- Alternatively, use `prisma generate` with `--schema` flag and inline env

### 2. Create: [`apps/api/Dockerfile`](../apps/api/Dockerfile)

Multi-stage Dockerfile for the NestJS API:

- **Stage 1 — Installer:** Same pattern as web — copy root manifests, install all deps
- **Stage 2 — Builder:** Copy source, build `@hmlogistik/database` (Prisma generate + tsc), then build API with `nest build`
- **Stage 3 — Runner:** Use `node:22-alpine`, copy only the built artifacts (`dist/`), set `NODE_ENV=production`, run with `node dist/main`

**Key considerations:**
- Prisma client must be generated during build (needs `DATABASE_URL` build arg)
- The runner stage needs `node_modules` with only production dependencies for Prisma runtime
- Use `COPY --from=builder` to bring in `dist/`, `node_modules/.prisma`, and `packages/database/dist/`

### 3. Create: [`docker-compose.prod.yml`](../docker-compose.prod.yml)

Production compose file with:

- **All 5 services** (caddy, web, api, postgres, minio)
- **Named volumes** for Postgres data and MinIO data (persistent across restarts)
- **Networks:** `frontend` (caddy ↔ web), `backend` (api ↔ db, api ↔ minio), or a single shared network
- **Health checks** for postgres and minio
- **Restart policy:** `unless-stopped` on all services
- **Environment variables** loaded from `.env` file
- **Build context** set to project root (monorepo root) so Docker can access all workspace packages
- **Dependency ordering:** `api` depends on `postgres` and `minio`; `web` depends on `api` (optional, for startup ordering)

### 4. Create: [`Caddyfile`](../Caddyfile)

Minimal Caddy configuration:

```
hmlogistik.com {
    reverse_proxy /api/* web:80
    reverse_proxy web:80
}
```

With automatic HTTPS via Let's Encrypt (Caddy handles this automatically when the domain is properly configured).

### 5. Create: [`.env.prod.example`](../.env.prod.example)

Template for production environment variables:

```bash
# Domain
DOMAIN=hmlogistik.com

# Postgres
POSTGRES_USER=hmlogistik
POSTGRES_PASSWORD=<generate-strong-password>
POSTGRES_DB=hmlogistik
DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}

# MinIO
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=<generate-strong-password>
MINIO_ENDPOINT=minio:9000
MINIO_ACCESS_KEY=<same-as-root-user>
MINIO_SECRET_KEY=<same-as-root-password>
MINIO_BUCKET=hmlogistik-files
MINIO_USE_SSL=false

# API
PORT=3000
CORS_ORIGIN=https://${DOMAIN}

# Prisma
DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
```

### 6. Create: [`deploy.sh`](../deploy.sh)

One-command deployment script:

1. SSH into the Droplet (or run locally on the Droplet after cloning)
2. Copy `.env` file from a secure location (or prompt to create)
3. Run `docker compose -f docker-compose.prod.yml up -d --build`
4. Run Prisma migrations: `docker compose -f docker-compose.prod.yml exec api npx prisma migrate deploy`
5. Verify health of all services

---

## Detailed Implementation Steps

### Step 1: Fix `apps/web/Dockerfile`

**Problem:** The `builder` stage runs `yarn workspace @hmlogistik/database build` which calls `prisma generate`. Prisma needs `DATABASE_URL` to connect to the database and introspect the schema. In the Docker build, there's no database running, but Prisma generate only needs the schema file — however, the `prisma.config.ts` reads `process.env.DATABASE_URL`.

**Solution:** Add a build argument and create a temporary `.env` file:

```dockerfile
ARG DATABASE_URL
RUN echo "DATABASE_URL=$DATABASE_URL" > .env && \
    yarn workspace @hmlogistik/database build && \
    rm .env
```

The `DATABASE_URL` doesn't need to point to a real database — it just needs to be a valid Postgres connection string so Prisma can validate the schema. We can use a placeholder like `postgresql://placeholder:placeholder@localhost:5432/placeholder`.

### Step 2: Create `apps/api/Dockerfile`

Multi-stage build:

```dockerfile
# Stage 1: Installer
FROM node:22-alpine AS installer
WORKDIR /app
COPY package.json yarn.lock turbo.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/database/package.json packages/database/package.json
COPY packages/eslint-config/package.json packages/eslint-config/package.json
RUN yarn install --frozen-lockfile --production=false

# Stage 2: Builder
FROM installer AS builder
WORKDIR /app
COPY . .
ARG DATABASE_URL
RUN echo "DATABASE_URL=$DATABASE_URL" > .env && \
    yarn workspace @hmlogistik/database build && \
    rm .env
RUN yarn workspace api build

# Stage 3: Runner
FROM node:22-alpine AS runner
WORKDIR /app
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy built artifacts
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/packages/database/dist ./packages/database/dist
COPY --from=builder /app/packages/database/prisma ./packages/database/prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/apps/api/package.json ./package.json

# Install production dependencies only
RUN yarn install --frozen-lockfile --production=true

USER appuser
EXPOSE 3000
CMD ["node", "dist/main"]
```

### Step 3: Create `docker-compose.prod.yml`

```yaml
services:
  postgres:
    image: postgres:17-alpine
    restart: unless-stopped
    volumes:
      - pgdata:/var/lib/postgresql/data
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 10s
      timeout: 5s
      retries: 5

  minio:
    image: minio/minio:latest
    restart: unless-stopped
    command: server /data --console-address ":9001"
    volumes:
      - minio_data:/data
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD}
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 10s
      timeout: 5s
      retries: 5

  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
      args:
        DATABASE_URL: ${DATABASE_URL}
    restart: unless-stopped
    environment:
      PORT: 3000
      DATABASE_URL: ${DATABASE_URL}
      CORS_ORIGIN: https://${DOMAIN}
      MINIO_ENDPOINT: minio
      MINIO_PORT: 9000
      MINIO_ACCESS_KEY: ${MINIO_ROOT_USER}
      MINIO_SECRET_KEY: ${MINIO_ROOT_PASSWORD}
      MINIO_BUCKET: ${MINIO_BUCKET}
      MINIO_USE_SSL: "false"
    depends_on:
      postgres:
        condition: service_healthy
      minio:
        condition: service_healthy

  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
      args:
        DATABASE_URL: ${DATABASE_URL}
    restart: unless-stopped
    depends_on:
      - api

  caddy:
    image: caddy:2-alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
      - caddy_config:/config
    depends_on:
      - web
      - api

volumes:
  pgdata:
  minio_data:
  caddy_data:
  caddy_config:
```

### Step 4: Create `Caddyfile`

```
${DOMAIN} {
    reverse_proxy /api/* api:3000
    reverse_proxy web:80
}
```

### Step 5: Create `.env.prod.example`

As described above.

### Step 6: Create `deploy.sh`

```bash
#!/bin/bash
set -e

echo "=== HM Logistik Production Deployment ==="

# Check if .env exists
if [ ! -f .env ]; then
    echo "Error: .env file not found!"
    echo "Copy .env.prod.example to .env and fill in your values."
    exit 1
fi

# Pull latest code (if running on Droplet)
if [ -d .git ]; then
    echo "Pulling latest code..."
    git pull origin main
fi

# Build and start services
echo "Building and starting services..."
docker compose -f docker-compose.prod.yml up -d --build

# Run database migrations
echo "Running database migrations..."
docker compose -f docker-compose.prod.yml exec -T api npx prisma migrate deploy

echo "=== Deployment complete! ==="
echo "Check status: docker compose -f docker-compose.prod.yml ps"
```

---

## Environment Variables Required

| Variable | Description | Example |
|----------|-------------|---------|
| `DOMAIN` | Production domain | `hmlogistik.com` |
| `POSTGRES_USER` | DB user | `hmlogistik` |
| `POSTGRES_PASSWORD` | DB password | (generate strong) |
| `POSTGRES_DB` | DB name | `hmlogistik` |
| `DATABASE_URL` | Full Postgres connection string | `postgresql://user:pass@postgres:5432/hmlogistik` |
| `MINIO_ROOT_USER` | MinIO admin user | `minioadmin` |
| `MINIO_ROOT_PASSWORD` | MinIO admin password | (generate strong) |
| `MINIO_BUCKET` | MinIO bucket name | `hmlogistik-files` |

---

## Deployment Steps (Manual)

1. **Create a DigitalOcean Droplet** (Ubuntu 24.04, at least 2GB RAM)
2. **Install Docker & Docker Compose** on the Droplet
3. **Clone the repository** on the Droplet
4. **Create `.env` file** from `.env.prod.example` with real values
5. **Point your domain** to the Droplet's IP address
6. **Run `deploy.sh`** (or manually execute the compose commands)
7. **Verify** the site is accessible via HTTPS

---

## Potential Issues & Mitigations

| Issue | Mitigation |
|-------|------------|
| Prisma generate needs DATABASE_URL during build | Pass as build arg with a placeholder value |
| MinIO bucket doesn't exist on first run | Add a startup script or init container to create the bucket |
| Caddy SSL certificate rate limiting | Caddy handles this automatically with Let's Encrypt |
| Docker build context is large (monorepo) | `.dockerignore` already excludes `node_modules`, `.git`, etc. |
| Prisma migrations need to run on deploy | `deploy.sh` runs `prisma migrate deploy` after services start |
| API starts before Postgres is ready | `depends_on` with `condition: service_healthy` |