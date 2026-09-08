# Multi-stage Dockerfile for Frontend (React & Vite)
FROM node:22-alpine AS builder

WORKDIR /app

RUN npm install -g pnpm

COPY package.json package-lock.json* pnpm-lock.yaml* ./
RUN echo "enable-pre-post-scripts=true" > .npmrc && \
    echo "strict-peer-dependencies=false" >> .npmrc && \
    pnpm install --no-frozen-lockfile

COPY . .
RUN pnpm run build

# Nginx Production Stage
FROM nginx:alpine

# Copy built frontend assets
COPY --from=builder /app/dist /usr/share/nginx/html

# SPA fallback configuration
RUN echo 'server { \
    listen 80; \
    server_name _; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ { \
        expires 1y; \
        add_header Cache-Control "public, no-transform"; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]