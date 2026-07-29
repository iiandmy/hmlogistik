FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json yarn.lock ./
COPY apps/api/package.json apps/api/tsconfig.json apps/api/tsconfig.build.json apps/api/nest-cli.json apps/api/
COPY packages/database/package.json packages/database/tsconfig.json packages/database/prisma.config.ts packages/database/

RUN yarn install --frozen-lockfile

COPY packages/database/prisma ./packages/database/prisma
COPY packages/database/index.ts ./packages/database/index.ts

RUN echo "DATABASE_URL=postgresql://postgres:postgres@postgres:5432/hmlogistik" > .env \
 && yarn workspace @hmlogistik/database build

COPY apps/api/src ./apps/api/src

RUN yarn workspace api build

FROM node:22-alpine
WORKDIR /app

COPY --from=builder /app/apps/api/dist ./apps/api/dist

COPY --from=builder /app/packages/database/package.json ./packages/database/
COPY --from=builder /app/packages/database/dist ./packages/database/dist
COPY --from=builder /app/packages/database/prisma/generated ./packages/database/prisma/generated

COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000
CMD ["node", "apps/api/dist/main.js"]
