import express, { Request, Response } from "express";
import multer from "multer";
import { s3Service } from "../services/s3Service.js";
import { authenticateJWT } from "../middleware/auth.js";

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/") || file.mimetype === "application/pdf" || file.mimetype === "application/json") {
      cb(null, true);
    } else {
      cb(new Error("Format file tidak didukung. Harap unggah gambar (JPG, PNG, WebP) atau dokumen PDF/JSON."));
    }
  },
});

// Protect all upload routes
router.use(authenticateJWT);

// GET /api/upload/s3-status - Check S3 cloud storage configuration status
router.get("/s3-status", (_req: Request, res: Response) => {
  res.json(s3Service.getStatus());
});

// POST /api/upload/test-s3 - Test direct S3 connection
router.post("/test-s3", async (_req: Request, res: Response) => {
  const result = await s3Service.testConnection();
  if (result.success) {
    res.json(result);
  } else {
    res.status(400).json(result);
  }
});

// POST /api/upload/image - Upload single image (products/avatars/attachments)
router.post("/image", upload.single("image"), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Tidak ada file gambar yang diunggah" });
    }

    const folder = (req.body.folder as string) || "products";
    const uploadResult = await s3Service.uploadFile({
      buffer: req.file.buffer,
      fileName: req.file.originalname,
      contentType: req.file.mimetype,
      folder,
    });

    res.status(201).json({
      message: `File berhasil diunggah ke ${uploadResult.storage === "AWS_S3" ? "AWS S3 Cloud" : "Penyimpanan Lokal"}`,
      url: uploadResult.url,
      storage: uploadResult.storage,
      size: uploadResult.size,
      key: uploadResult.key,
    });
  } catch (err: any) {
    console.error("Upload Error:", err);
    res.status(500).json({ message: err.message || "Gagal mengunggah file" });
  }
});

export default router;
