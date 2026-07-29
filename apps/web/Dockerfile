# =============================================================================
# Stage 1: Build
# =============================================================================
FROM node:22-alpine AS builder
WORKDIR /app

# ---------- Dependencies ----------
COPY package.json yarn.lock ./
COPY apps/web/package.json apps/web/tsconfig.json apps/web/tsconfig.app.json apps/web/tsconfig.node.json apps/web/vite.config.ts apps/web/index.html apps/web/
COPY packages/database/package.json packages/database/tsconfig.json packages/database/prisma.config.ts packages/database/
COPY packages/eslint-config/package.json packages/eslint-config/

RUN yarn install --frozen-lockfile

# ---------- Build @hmlogistik/database ----------
COPY packages/database/prisma ./packages/database/prisma
COPY packages/database/index.ts ./packages/database/index.ts

RUN npx prisma generate --schema=packages/database/prisma/schema.prisma \
 && npx tsc -b packages/database

# ---------- Build Web ----------
COPY apps/web/src ./apps/web/src
COPY apps/web/public ./apps/web/public

RUN yarn workspace web build

# =============================================================================
# Stage 2: Nginx
# =============================================================================
FROM nginx:alpine
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
