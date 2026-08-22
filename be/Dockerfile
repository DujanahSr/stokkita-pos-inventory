# Gunakan image Node.js versi 20 yang ringan
FROM node:20-alpine

# Set folder kerja di dalam container
WORKDIR /app

# Install pnpm karena proyek ini menggunakan pnpm
RUN npm install -g pnpm

# Copy package.json dan pnpm-lock.yaml ke dalam container
COPY package.json pnpm-lock.yaml ./

# Install dependencies (frozen-lockfile agar versi pasti sama persis)
RUN pnpm install --frozen-lockfile

# Copy seluruh sisa kode backend ke dalam container
COPY . .

# Beri tahu Docker bahwa aplikasi ini jalan di port 3000
EXPOSE 3000

# Perintah untuk menjalankan aplikasi saat container hidup
CMD ["node", "api/index.js"]