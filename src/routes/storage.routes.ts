// src/routes/storage.routes.ts
import { Router } from "express";
import {
  uploadChunk,
  mergeChunksAndUpload,
  listFiles,
  deleteFile,
} from "../controllers/storage.controller";
import { uploadMiddleware } from "../services/upload.service";

const router = Router();

// 分片上传：使用 multer 中间件接收单个分片文件
router.post("/upload/chunk", uploadMiddleware.single("file"), uploadChunk);

// 合并分片 +（可选）上传 MK20
router.post("/upload/complete", mergeChunksAndUpload);

// 文件列表
router.get("/files", listFiles);

// 删除记录
router.delete("/files/:id", deleteFile);

export default router;
