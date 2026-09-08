# Multi-stage Dockerfile for Backend API (Node.js & Express)
FROM node:22-alpine AS builder

WORKDIR /app

# Install build tools for native addons (bcrypt)
RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json* pnpm-lock.yaml* ./
RUN npm install --legacy-peer-deps

COPY . .
RUN npm run build

# Production Runner Stage
FROM node:22-alpine AS runner

WORKDIR /app

RUN apk add --no-cache python3 make g++

ENV NODE_ENV=production
ENV PORT=3000

COPY package.json package-lock.json* ./
RUN npm install --omit=dev --legacy-peer-deps

COPY --from=builder /app/dist ./dist

# Create uploads directory
RUN mkdir -p uploads

EXPOSE 3000

CMD ["node", "dist/api/index.js"]