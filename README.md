# background-agent-railway

> This is the companion repo for <INSERT YT LINK + THUMBNAIL>, in partnership with [Railway](https://railway.com?referralCode=P06La2).

It is a small full-stack demo that provisions and routes sandbox sessions (inspired by https://builders.ramp.com/post/why-we-built-our-background-agent)

## Project structure

- `packages/api`: Express + TypeScript API, Railway integration, session management, and proxying.
- `packages/web`: React + Vite frontend.
- `packages/sandbox`: Sandbox container image used by session environments.
- `docker-compose.yml`: Local API + Postgres + sandbox containers for development.

## Prerequisites

- [Mise](https://mise.jdx.dev/)
- Docker + Docker Compose

## Local development

1. Start local infra:

   ```bash
   docker compose up -d
   ```

2. Configure API environment variables:

   ```bash
   cp packages/api/.env.example packages/api/.env
   ```

3. Install dependencies:

   ```bash
   pnpm install --dir packages/api
   pnpm install --dir packages/web
   ```

4. Run API and web app in separate terminals:

   ```bash
   pnpm --dir packages/api dev
   pnpm --dir packages/web dev
   ```

The API runs on `http://localhost:3000` and the web app runs on `http://localhost:5173`.

## Useful API commands

```bash
pnpm --dir packages/api db:generate
pnpm --dir packages/api db:migrate
pnpm --dir packages/api build
pnpm --dir packages/api start
```

## Useful web commands

```bash
pnpm --dir packages/web build
pnpm --dir packages/web preview
```
