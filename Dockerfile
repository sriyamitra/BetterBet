FROM node:22-slim

RUN npm install -g pnpm

WORKDIR /app
COPY . .

RUN pnpm install --no-frozen-lockfile --ignore-scripts
RUN pnpm --filter @workspace/api-server run build

EXPOSE 3000
ENV PORT=3000

CMD ["sh", "-c", "pnpm --filter @workspace/db run push && node --enable-source-maps artifacts/api-server/dist/index.mjs"]
