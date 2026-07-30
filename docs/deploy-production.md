# Production Deploy

## Prerequisites

- Ubuntu 24.04 Droplet on DigitalOcean
- domain for the app, for example `app.example.com`
- subdomain for file downloads, for example `files.example.com`
- Docker Engine with Docker Compose plugin

## DNS

Create two `A` records pointing to the Droplet IP:

- `app.example.com`
- `files.example.com`

## Server Setup

Install Docker on the Droplet:

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker "$USER"
```

Reconnect over SSH after adding your user to the `docker` group.

Open ports `80` and `443` in the DigitalOcean firewall.

## Project Setup

```bash
git clone <repo-url>
cd hmlogistik
cp .env.prod.example .env
```

Edit `.env` and fill in real values.

Required values:

- `DOMAIN`: public frontend domain
- `FILES_DOMAIN`: public domain for signed MinIO downloads
- `DATABASE_URL`: full Prisma connection string to the `postgres` service
- `MINIO_PUBLIC_URL`: must match `https://<FILES_DOMAIN>`
- `CORS_ORIGIN`: must match `https://<DOMAIN>`

## Deploy

There are two equivalent ways to deploy:

- use `./deploy.sh` for the default production flow
- run the compose commands manually if you want to control each step yourself

### Option A: Deploy Script

```bash
chmod +x deploy.sh
./deploy.sh
```

`deploy.sh` performs the same sequence as the manual instructions below:

- build images
- start `postgres` and `minio`
- run `prisma migrate deploy`
- start `api` and `web`
- print `docker compose ps`

### Option B: Manual Commands

Build images:

```bash
docker compose -f docker-compose.prod.yml build
```

Start infrastructure first:

```bash
docker compose -f docker-compose.prod.yml up -d postgres minio
```

Run Prisma migrations:

```bash
docker compose -f docker-compose.prod.yml --profile tools run --rm migrate
```

The migration container runs Prisma from `/app/packages/database`, so it uses the same `prisma.config.ts` and `prisma/migrations` directory as the workspace itself.

Start the application:

```bash
docker compose -f docker-compose.prod.yml up -d api web
```

Check status:

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f api web
```

## Verify

Open:

- `https://<DOMAIN>`
- `https://<DOMAIN>/api/transfers`

If file uploads already exist, verify that returned `downloadUrl` values use `https://<FILES_DOMAIN>/...`.

## Update Release

Using the script:

```bash
git pull --ff-only
./deploy.sh
```

Or manually:

```bash
git pull --ff-only
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml --profile tools run --rm migrate
docker compose -f docker-compose.prod.yml up -d api web
```

## Useful Commands

```bash
docker compose -f docker-compose.prod.yml logs -f
docker compose -f docker-compose.prod.yml restart api
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml down -v
```
