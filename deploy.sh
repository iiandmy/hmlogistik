#!/usr/bin/env bash
# =============================================================================
# HM Logistik — Production Deployment Script
# =============================================================================
# Usage:
#   1. SSH into your DigitalOcean Droplet (or any Linux host with Docker)
#   2. Clone the repository:  git clone <repo-url> && cd hmlogistik
#   3. Create .env from template:  cp .env.prod.example .env
#   4. Edit .env with your production values
#   5. Run this script:  bash deploy.sh
# =============================================================================

set -euo pipefail

# ── Colors for output ───────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

info()  { echo -e "${GREEN}[INFO]${NC}  $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*"; }

# ── Pre-flight checks ──────────────────────────────────────────────────────
if [ ! -f .env ]; then
    error ".env file not found!"
    echo ""
    echo "  Create it from the template:"
    echo "    cp .env.prod.example .env"
    echo ""
    echo "  Then edit .env with your production values."
    exit 1
fi

if ! command -v docker &> /dev/null; then
    error "Docker is not installed. Install it first:"
    echo "  https://docs.docker.com/engine/install/"
    exit 1
fi

if ! docker compose version &> /dev/null; then
    error "Docker Compose is not installed."
    echo "  https://docs.docker.com/compose/install/"
    exit 1
fi

# ── Pull latest code (if inside a git repository) ──────────────────────────
if [ -d .git ]; then
    info "Pulling latest code from git..."
    git pull --ff-only origin main || warn "Git pull failed — continuing with local code."
fi

# ── Build and start services ───────────────────────────────────────────────
info "Building and starting production services..."
docker compose -f docker-compose.prod.yml up -d --build

# ── Wait for API to be ready ───────────────────────────────────────────────
info "Waiting for API container to be ready..."
for i in $(seq 1 30); do
    if docker compose -f docker-compose.prod.yml exec -T api node -e "process.exit(0)" &>/dev/null; then
        info "API container is ready!"
        break
    fi
    if [ "$i" -eq 30 ]; then
        warn "API container did not respond in time — continuing anyway."
    fi
    sleep 2
done

# ── Run database migrations ────────────────────────────────────────────────
info "Running database migrations..."
# Prisma config (prisma.config.ts) lives in packages/database/,
# so we must run the migrate command from that directory.
docker compose -f docker-compose.prod.yml exec -T api \
    sh -c "cd packages/database && prisma migrate deploy"

# ── Verify services ────────────────────────────────────────────────────────
info "Checking service status..."
docker compose -f docker-compose.prod.yml ps

# ── Done ───────────────────────────────────────────────────────────────────
echo ""
info "============================================"
info "  Deployment complete!"
info "============================================"
echo ""
echo "  Your application should now be accessible at:"
echo "  https://$(grep ^DOMAIN .env | cut -d= -f2)"
echo ""
echo "  Useful commands:"
echo "    View logs:       docker compose -f docker-compose.prod.yml logs -f"
echo "    Restart API:     docker compose -f docker-compose.prod.yml restart api"
echo "    Stop all:        docker compose -f docker-compose.prod.yml down"
echo "    Stop + volumes:  docker compose -f docker-compose.prod.yml down -v"
echo ""