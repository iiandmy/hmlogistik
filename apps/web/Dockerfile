FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json yarn.lock ./
COPY apps/web/package.json apps/web/tsconfig.json apps/web/tsconfig.app.json apps/web/tsconfig.node.json apps/web/vite.config.ts apps/web/index.html apps/web/

RUN yarn install --frozen-lockfile

COPY apps/web/src ./apps/web/src
COPY apps/web/public ./apps/web/public

RUN yarn workspace web build

FROM nginx:alpine
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
