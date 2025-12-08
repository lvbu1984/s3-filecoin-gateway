// src/routes/upload.routes.ts
import { Router } from "express";
import multer from "multer";
import {
  initUploadHandler,
  uploadChunkHandler,
  completeUploadHandler,
} from "../controllers/upload.controller";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// 初始化上传，获取 uploadId
router.post("/init", initUploadHandler);

// 上传单个分片（字段名 chunk）
router.post("/chunk", upload.single("chunk"), uploadChunkHandler);

// 完成上传（合并 + 调用 stub CC）
router.post("/complete", completeUploadHandler);

export default router;
