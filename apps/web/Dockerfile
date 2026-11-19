FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

COPY package.json package-lock.json turbo.json tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/database/package.json packages/database/
COPY apps/web/package.json apps/web/

RUN npm install

COPY packages/shared packages/shared
COPY packages/database packages/database
COPY apps/web apps/web

RUN npm --workspace=@dco/database run generate \
 && npm --workspace=@dco/shared run build \
 && npm --workspace=@dco/database run build \
 && npm --workspace=@dco/web run build \
 && mkdir -p /app/.local-data/uploads

ENV NODE_ENV=production
EXPOSE 3000
CMD ["npm", "--workspace=@dco/web", "run", "start"]
