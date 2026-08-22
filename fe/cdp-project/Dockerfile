# === TAHAP 1: Proses Build ===
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files dan install dependencies
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy seluruh kode frontend (termasuk .env)
COPY . .

# Build aplikasi untuk production
RUN pnpm run build

# === TAHAP 2: Serve dengan Nginx ===
FROM nginx:alpine

# Hapus konfigurasi default bawaan Nginx
RUN rm /etc/nginx/conf.d/default.conf

# Copy konfigurasi custom Nginx yang baru saja kita buat
COPY nginx.conf /etc/nginx/conf.d/

# Copy hasil build dari "TAHAP 1" (folder dist) ke folder HTML Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]