FROM node:22-alpine

WORKDIR /app

RUN corepack enable

COPY packages/api/package.json ./package.json
COPY packages/api/tsconfig.json ./tsconfig.json
COPY packages/api/drizzle.config.ts ./drizzle.config.ts

RUN pnpm install

COPY packages/api/src ./src

RUN pnpm build

EXPOSE 3000

CMD ["node", "dist/index.js"]
