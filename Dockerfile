FROM node:24-bookworm-slim

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@11.24.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --prod=false

COPY . .
RUN pnpm build

RUN chmod +x scripts/docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["/bin/sh", "scripts/docker-entrypoint.sh"]
