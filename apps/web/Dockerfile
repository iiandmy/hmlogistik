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
# STAGE 2: Builder — build workspace dependencies + web app
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

# Build the web application (tsc type-check + vite bundling)
RUN yarn workspace web build

# =============================================================================
# STAGE 3: Runner — serve static files via nginx:alpine
# =============================================================================
FROM nginx:alpine AS runner

# Use a non-root user for security
RUN adduser -D -H -h /dev/null -s /sbin/nologin -u 1000 -G nginx appuser

# Copy built artifacts from the builder stage
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# Copy custom nginx configuration (includes /api/ reverse proxy)
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

# Drop root privileges
USER appuser

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]