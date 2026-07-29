#!/usr/bin/env bash
# =============================================================================
# HM Logistik — Full Docker Cleanup Script
# =============================================================================
# Run this on the DigitalOcean Droplet to wipe ALL Docker state and start fresh.
#
#   bash docker-cleanup.sh
#
# WARNING: This will DELETE:
#   - All containers (running + stopped)
#   - All volumes (Postgres data, MinIO data, Caddy certs)
#   - All images (including cached build layers)
#   - All build cache
# =============================================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info()  { echo -e "${GREEN}[INFO]${NC}  $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*"; }

echo ""
warn "=============================================="
warn "  THIS WILL DELETE ALL DOCKER DATA"
warn "=============================================="
echo ""
warn "  This includes:"
warn "    • All containers (postgres, minio, api, web, caddy)"
warn "    • All volumes (database, files, certificates)"
warn "    • All images (including cached build layers)"
warn "    • All build cache"
echo ""
read -rp "Are you sure? Type 'yes' to continue: " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    info "Aborted."
    exit 0
fi

# ── Step 1: Stop and remove containers + volumes + orphan images ───────────
info "Step 1/4: Stopping and removing containers, volumes, and images..."

# Stop production services if running
if [ -f docker-compose.prod.yml ]; then
    docker compose -f docker-compose.prod.yml down --volumes --remove-orphans 2>/dev/null || true
fi

# Stop dev services if running
if [ -f docker-compose.dev.yml ]; then
    docker compose -f docker-compose.dev.yml down --volumes --remove-orphans 2>/dev/null || true
fi

# ── Step 2: Remove ALL unused Docker resources ─────────────────────────────
info "Step 2/4: Removing all unused containers, networks, and dangling images..."
docker system prune --all --volumes --force

# ── Step 3: Remove build cache ─────────────────────────────────────────────
info "Step 3/4: Removing Docker build cache..."
docker builder prune --all --force

# ── Step 4: Verify cleanup ─────────────────────────────────────────────────
info "Step 4/4: Verifying cleanup..."
echo ""
info "Remaining containers:"
docker ps -a 2>/dev/null || echo "  (none)"
echo ""
info "Remaining images:"
docker images 2>/dev/null || echo "  (none)"
echo ""
info "Remaining volumes:"
docker volume ls 2>/dev/null || echo "  (none)"
echo ""

info "============================================"
info "  Cleanup complete! Docker is now empty."
info "============================================"
echo ""
info "To rebuild and deploy:"
echo "  bash deploy.sh"
echo ""