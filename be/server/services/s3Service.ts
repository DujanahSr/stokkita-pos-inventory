import { S3Client, PutObjectCommand, GetObjectCommand, HeadBucketCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, "../../uploads");

// Ensure local uploads directory exists for fallback
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const region = process.env.AWS_REGION || "ap-southeast-1"; // Default to Jakarta/Singapore
const accessKeyId = process.env.AWS_ACCESS_KEY_ID || "";
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || "";
const bucketName = process.env.AWS_S3_BUCKET_NAME || "";
const endpoint = process.env.AWS_S3_ENDPOINT || undefined;

let s3Client: S3Client | null = null;

if (accessKeyId && secretAccessKey && bucketName) {
  try {
    s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      ...(endpoint ? { endpoint, forcePathStyle: true } : {}),
    });
    console.log(`[AWS S3] Initialized client for bucket: ${bucketName} in region: ${region}`);
  } catch (err) {
    console.error("[AWS S3] Failed to initialize S3 client:", err);
    s3Client = null;
  }
} else {
  console.log("[AWS S3] AWS credentials not detected. Running in Local Storage Fallback Mode.");
}

export interface UploadResult {
  url: string;
  key: string;
  storage: "AWS_S3" | "LOCAL";
  size: number;
}

export const s3Service = {
  isConfigured(): boolean {
    return !!(s3Client && bucketName);
  },

  getStatus() {
    const isConfigured = this.isConfigured();
    return {
      configured: isConfigured,
      storage_mode: isConfigured ? "AWS_S3" : "LOCAL_FALLBACK",
      bucket: bucketName || "(Belum Dikonfigurasi)",
      region: region || "ap-southeast-1",
      provider: "Amazon Web Services (AWS S3)"
    };
  },

  async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!s3Client || !bucketName) {
      return {
        success: false,
        message: "AWS Credentials belum lengkap di file .env (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET_NAME)"
      };
    }

    try {
      await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
      return {
        success: true,
        message: `Koneksi ke AWS S3 Bucket "${bucketName}" (${region}) berhasil terverifikasi!`
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Gagal mengakses S3 Bucket: ${err.message || err.name || "Akses ditolak"}`
      };
    }
  },

  async uploadFile({
    buffer,
    fileName,
    contentType = "application/octet-stream",
    folder = "products",
  }: {
    buffer: Buffer;
    fileName: string;
    contentType?: string;
    folder?: string;
  }): Promise<UploadResult> {
    const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
    const uniqueKey = `${folder}/${Date.now()}-${sanitizedName}`;

    // Mode 1: AWS S3 Cloud Storage
    if (s3Client && bucketName) {
      try {
        await s3Client.send(
          new PutObjectCommand({
            Bucket: bucketName,
            Key: uniqueKey,
            Body: buffer,
            ContentType: contentType,
          })
        );

        // Standard S3 public URL format
        const s3Url = endpoint
          ? `${endpoint}/${bucketName}/${uniqueKey}`
          : `https://${bucketName}.s3.${region}.amazonaws.com/${uniqueKey}`;

        return {
          url: s3Url,
          key: uniqueKey,
          storage: "AWS_S3",
          size: buffer.length,
        };
      } catch (err) {
        console.error("[AWS S3 Upload Error, falling back to local]:", err);
      }
    }

    // Mode 2: Local Storage Fallback
    const localTargetDir = path.join(uploadsDir, folder);
    if (!fs.existsSync(localTargetDir)) {
      fs.mkdirSync(localTargetDir, { recursive: true });
    }

    const localFilePath = path.join(localTargetDir, `${Date.now()}-${sanitizedName}`);
    fs.writeFileSync(localFilePath, buffer);

    const relativeUrl = `/uploads/${folder}/${path.basename(localFilePath)}`;
    return {
      url: relativeUrl,
      key: relativeUrl,
      storage: "LOCAL",
      size: buffer.length,
    };
  },

  async uploadBackup({
    jsonContent,
    fileName,
  }: {
    jsonContent: string;
    fileName: string;
  }): Promise<UploadResult> {
    const buffer = Buffer.from(jsonContent, "utf-8");
    return this.uploadFile({
      buffer,
      fileName,
      contentType: "application/json",
      folder: "backups",
    });
  },

  async getDownloadPresignedUrl(key: string, expiresInSeconds = 3600): Promise<string | null> {
    if (!s3Client || !bucketName) return null;
    try {
      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
      });
      return await getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
    } catch (err) {
      console.error("[AWS S3 Presigned URL Error]:", err);
      return null;
    }
  },
};
