FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

COPY package.json package-lock.json turbo.json tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/database/package.json packages/database/
COPY apps/realtime/package.json apps/realtime/

RUN npm install

COPY packages/shared packages/shared
COPY packages/database packages/database
COPY apps/realtime apps/realtime

RUN npm --workspace=@dco/database run generate \
 && npm --workspace=@dco/shared run build \
 && npm --workspace=@dco/database run build \
 && npm --workspace=@dco/realtime run build

ENV NODE_ENV=production
EXPOSE 2567
CMD ["node", "apps/realtime/dist/index.js"]
