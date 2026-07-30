#!/usr/bin/env bash

set -euo pipefail

if [ ! -f .env ]; then
    printf '.env file not found. Create it from .env.prod.example first.\n' >&2
    exit 1
fi

docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d postgres minio
docker compose -f docker-compose.prod.yml --profile tools run --rm migrate
docker compose -f docker-compose.prod.yml up -d api web
docker compose -f docker-compose.prod.yml ps
