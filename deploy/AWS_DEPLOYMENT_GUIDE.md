# 🚀 Panduan Lengkap Deployment & Integrasi AWS Dasar (EC2, S3, RDS, IAM)
## Sistem Manajemen Stok & POS Enterprise — StokKita

Dokumen ini adalah panduan teknis langkah demi langkah (*step-by-step production guide*) untuk mendeploy aplikasi **StokKita** ke ekosistem **Amazon Web Services (AWS)** menggunakan 4 pilar layanan cloud standar industri:
1. **AWS IAM** (*Identity & Access Management*) — Manajemen hak akses kredensial aman.
2. **AWS S3** (*Simple Storage Service*) — Penyimpanan foto produk & file backup database.
3. **AWS RDS** (*Relational Database Service*) — Basis data PostgreSQL cloud terkelola.
4. **AWS EC2** (*Elastic Compute Cloud*) — Server virtual Linux untuk menjalankan frontend, backend, dan gateway NGINX.

---

## 🏛️ 1. Diagram Arsitektur Cloud AWS

```
                           [ INTERNET / PENGGUNA ]
                                      │
                         HTTPS :443 / HTTP :80
                                      ▼
             ┌───────────────────────────────────────────────────┐
             │            AWS EC2 (Ubuntu Linux)                 │
             │                                                   │
             │   ┌───────────────────────────────────────────┐   │
             │   │            NGINX Gateway Proxy            │   │
             │   └───────────────┬───────────────────────────┘   │
             │                   │                               │
             │     ┌─────────────┴─────────────┐                 │
             │     ▼                           ▼                 │
             │ ┌───────────────┐       ┌───────────────┐         │
             │ │ Frontend SPA  │       │  Backend API  │         │
             │ │ (React Vite)  │       │ (Express.js)  │         │
             │ └───────────────┘       └───────┬───────┘         │
             │                                 │                 │
             │                       In-Memory │                 │
             │                                 ▼                 │
             │                         ┌───────────────┐         │
             │                         │  Redis Cache  │         │
             │                         └───────────────┘         │
             └─────────────────────────────────┬─────────────────┘
                                               │
               ┌───────────────────────────────┴───────────────────────────────┐
               ▼                                                               ▼
┌───────────────────────────────┐                               ┌───────────────────────────────┐
│     AWS S3 Bucket Storage     │                               │     AWS RDS (PostgreSQL)      │
│  - Foto Produk (/products)    │                               │  - Multi-AZ High Availability │
│  - Backup Database (/backups) │                               │  - Automated Daily Backups    │
│  - Dokumen Surat Jalan & PO   │                               │  - TLS Enkripsi Data          │
└───────────────────────────────┘                               └───────────────────────────────┘
```

---

## 🔐 2. Langkah 1: Konfigurasi AWS IAM (Keamanan & Kredensial)

Prinsip keamanan terbaik di AWS adalah **Least Privilege** (hanya berikan hak akses yang benar-benar dibutuhkan).

### A. Buat Policy Khusus S3 di AWS IAM Console:
1. Buka [AWS IAM Console](https://console.aws.amazon.com/iam/).
2. Masuk ke menu **Policies** $\rightarrow$ Klik **Create Policy**.
3. Pilih tab **JSON**, lalu tempelkan (*paste*) konfigurasi policy berikut:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "StokKitaS3AccessPolicy",
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:DeleteObject",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::stokkita-pos-storage-production",
                "arn:aws:s3:::stokkita-pos-storage-production/*"
            ]
        }
    ]
}
```
*(Ganti `stokkita-pos-storage-production` dengan nama bucket yang Anda inginkan)*.
4. Beri nama policy: `StokKitaS3Policy` $\rightarrow$ Klik **Create Policy**.

### B. Buat IAM User untuk Backend:
1. Masuk ke menu **Users** $\rightarrow$ Klik **Create User**.
2. Beri nama: `stokkita-backend-app`.
3. Di bagian *Set permissions*, pilih **Attach policies directly** $\rightarrow$ Centang `StokKitaS3Policy` yang baru dibuat.
4. Klik **Create User**.
5. Buka user `stokkita-backend-app` $\rightarrow$ Buka tab **Security Credentials** $\rightarrow$ Klik **Create access key**.
6. Pilih use-case: *Application running outside AWS* atau *Other*.
7. **Simpan**:
   - `AWS_ACCESS_KEY_ID` (misal: `AKIAIOSFODNN7EXAMPLE`)
   - `AWS_SECRET_ACCESS_KEY` (misal: `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`)

---

## 📦 3. Langkah 2: Konfigurasi AWS S3 (Penyimpanan Cloud)

### A. Buat S3 Bucket:
1. Buka [AWS S3 Console](https://s3.console.aws.amazon.com/).
2. Klik **Create Bucket**.
3. **Bucket Name**: `stokkita-pos-storage-production` *(nama harus unik secara global)*.
4. **AWS Region**: `ap-southeast-1` (Singapore) atau `ap-southeast-3` (Jakarta).
5. Di bagian **Block Public Access settings for this bucket**:
   - Untuk bucket gambar produk yang perlu ditampilkan langsung di browser kasir, hilangkan centang *Block all public access*.
6. Klik **Create Bucket**.

### B. Konfigurasi CORS (Cross-Origin Resource Sharing):
Agar browser kasir dapat memuat gambar dan dokumen dari S3 tanpa diblokir:
1. Buka bucket Anda $\rightarrow$ Tab **Permissions** $\rightarrow$ Gulir ke **Cross-origin resource sharing (CORS)**.
2. Klik **Edit** dan masukkan JSON berikut:

```json
[
    {
        "AllowedHeaders": [
            "*"
        ],
        "AllowedMethods": [
            "GET",
            "PUT",
            "POST",
            "HEAD"
        ],
        "AllowedOrigins": [
            "*"
        ],
        "ExposeHeaders": []
    }
]
```
3. Klik **Save changes**.

---

## 🗄️ 4. Langkah 3: Konfigurasi AWS RDS (Database PostgreSQL)

### A. Buat Database RDS PostgreSQL Free Tier:
1. Buka [AWS RDS Console](https://console.aws.amazon.com/rds/).
2. Klik **Create database**.
3. **Engine type**: `PostgreSQL` (Pilih versi 15 atau 16).
4. **Templates**: Pilih **Free tier** (Gratis 750 jam/bulan).
5. **Settings**:
   - *DB instance identifier*: `stokkita-production-db`
   - *Master username*: `postgres`
   - *Master password*: `[Buat password yang kuat]`
6. **DB instance class**: `db.t3.micro` atau `db.t4g.micro` (1 vCPU, 1 GB RAM).
7. **Storage**: `20 GiB` General Purpose SSD (gp2/gp3).
8. **Connectivity**:
   - *Virtual Private Cloud (VPC)*: Default VPC.
   - *Public access*: **Yes** (agar mudah diakses selama migrasi awal) atau **No** (jika EC2 berada dalam VPC yang sama).
   - *VPC security group*: Buat baru / pilih yang mengizinkan inbound port `5432`.
9. Klik **Create database**.

### B. Format String Koneksi Database:
Setelah status RDS menjadi *Available*, salin **Endpoint**:
```bash
DATABASE_URL=postgresql://postgres:[PASSWORD]@[RDS-ENDPOINT.amazonaws.com]:5432/stokkita_db?sslmode=require
```

---

## 🖥️ 5. Langkah 4: Konfigurasi AWS EC2 (Server Produksi)

### A. Launch EC2 Instance:
1. Buka [AWS EC2 Console](https://console.aws.amazon.com/ec2/).
2. Klik **Launch Instance**.
3. **Name**: `stokkita-production-server`.
4. **OS Image**: `Ubuntu Server 24.04 LTS (HVM) 64-bit`.
5. **Instance Type**: `t2.micro` atau `t3.micro` (Free tier eligible).
6. **Key Pair (login)**: Buat key pair baru (`stokkita-key.pem`) dan simpan di laptop Anda.
7. **Network Settings (Security Group Inbound Rules)**:
   - Port `22` (SSH) — My IP
   - Port `80` (HTTP) — Anywhere (`0.0.0.0/0`)
   - Port `443` (HTTPS) — Anywhere (`0.0.0.0/0`)
8. **Storage**: `15 GiB - 30 GiB` gp3.
9. Klik **Launch Instance**.

---

### B. Setup Server & Jalankan Aplikasi di EC2:

1. **Hubungkan ke EC2 via Terminal / PowerShell**:
   ```bash
   chmod 400 stokkita-key.pem
   ssh -i "stokkita-key.pem" ubuntu@[IP-PUBLIK-EC2]
   ```

2. **Update Server & Install Docker**:
   ```bash
   sudo apt update && sudo apt upgrade -y
   sudo apt install -y curl git ufw

   # Install Docker & Docker Compose
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   sudo usermod -aG docker ubuntu
   newgrp docker
   ```

3. **Clone Repositori Proyek**:
   ```bash
   git clone https://github.com/[username]/stokkita-pos-inventory.git
   cd stokkita-pos-inventory
   ```

4. **Konfigurasi Environment Variables (`.env`)**:
   ```bash
   cp .env.example .env
   nano .env
   ```
   Isi konfigurasi produksi Anda:
   ```env
   NODE_ENV=production
   PORT=3000
   JWT_SECRET=rahasia_enterprise_jwt_super_aman_2026
   DATABASE_URL=postgresql://postgres:password123@stokkita-production-db.xxxxxx.ap-southeast-1.rds.amazonaws.com:5432/stokkita_db?sslmode=require
   REDIS_URL=redis://redis:6379

   AWS_REGION=ap-southeast-1
   AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
   AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
   AWS_S3_BUCKET_NAME=stokkita-pos-storage-production
   ```

5. **Jalankan Aplikasi dengan Docker Compose**:
   ```bash
   docker compose up -d --build
   ```

6. **Periksa Status Container**:
   ```bash
   docker compose ps
   ```
   Semua container (`stokkita_gateway`, `stokkita_backend`, `stokkita_frontend`, `stokkita_redis`) akan berstatus **Up (healthy)**.

---

## 🔒 6. Langkah 5: Pasang Domain & SSL HTTPS Gratis (Certbot Let's Encrypt)

1. Arahkan DNS Domain Anda (misal `app.stokkita.com`) dengan membuat **A Record** mengarah ke **IP Elastic AWS EC2**.
2. Install Certbot di server EC2:
   ```bash
   sudo apt install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d app.stokkita.com
   ```
3. Certbot akan otomatis mengonfigurasi sertifikat SSL HTTPS dengan renewal otomatis setiap 90 hari.

---

## 📋 7. Ringkasan Checklist Kesiapan Produksi

- [x] **AWS S3 Service SDK**: Terpasang di backend dengan *graceful local fallback*.
- [x] **AWS S3 Cloud Backup**: Endpoint `/api/settings/backup/s3` untuk auto-upload database backup.
- [x] **AWS RDS Connection**: Database Pool mendukung SSL TLS query ke Amazon RDS PostgreSQL.
- [x] **Multi-stage Dockerfile**: Backend & Frontend teroptimasi untuk performa container ringan.
- [x] **Docker Compose & NGINX**: Reverse proxy, gzip compression, security headers, dan routing `/api`.
- [x] **AWS IAM Least Privilege**: Template Policy JSON siap pakai.
