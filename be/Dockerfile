# === TAHAP 1: Proses Build TypeScript ===
FROM node:20-alpine AS builder

WORKDIR /app
RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./
RUN pnpm config set ignore-scripts true
RUN pnpm install --no-frozen-lockfile

COPY . .
RUN pnpm run build

# === TAHAP 2: Production ===
FROM node:20-alpine

WORKDIR /app
RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./
RUN pnpm config set ignore-scripts true
RUN pnpm install --no-frozen-lockfile --prod

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/api/index.js"]