// src/routes/storage.routes.ts
import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import {
  getStorageQuote,
  handleFileUpload,
  getUploadById,
  listUploads,
  createDealForUpload,
  getCurioConfig,
} from "../controllers/storage.controller";

const router = Router();

/**
 * 配置 multer，把文件存到项目根目录下的 /uploads 目录
 */
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (_req, file, cb) {
    // 用随机 uuid + 原始扩展名
    const randomId = cryptoRandomId();
    const ext = path.extname(file.originalname);
    cb(null, `${randomId}${ext}`);
  },
});

function cryptoRandomId(): string {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

const upload = multer({ storage });

/**
 * 路由：
 *  POST /api/storage/quote           -> 获取 demo 报价
 *  POST /api/storage/upload          -> 上传文件（multipart/form-data）
 *  GET  /api/storage/upload/:id      -> 查询单个上传记录
 *  GET  /api/storage/uploads         -> 列出所有上传记录
 *  POST /api/storage/upload/:id/deal -> 为该上传创建 MK20 Deal
 *  GET  /api/config/curio            -> 查看 Curio / MK20 配置情况
 */

router.post("/quote", getStorageQuote);

router.post("/upload", upload.single("file"), handleFileUpload);

router.get("/upload/:uploadId", getUploadById);

router.get("/uploads", listUploads);

router.post("/upload/:uploadId/deal", createDealForUpload);

router.get("/config/curio", getCurioConfig);

export default router;
