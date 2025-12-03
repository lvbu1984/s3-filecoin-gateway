// src/routes/storage.routes.ts
import { Router } from "express";
import multer from "multer";
import path from "path";
import os from "os";
import {
  handleUploadChunk,
  handleUploadComplete,
} from "../controllers/storage.controller";

const router = Router();

// 临时上传根目录（和之前 server.cjs 一样，放到系统临时目录）
const BASE_TMP_DIR = path.join(os.tmpdir(), "vaultx_uploads");

// 配置 multer，把每个分片先存到 BASE_TMP_DIR 里
const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, BASE_TMP_DIR),
    filename: (_req, file, cb) =>
      cb(null, `${Date.now()}-${file.originalname}`),
  }),
});

// 分片上传
router.post(
  "/upload/chunk",
  upload.single("file"), // 这里的 "file" 要和前端 form.append("file", c.blob) 对应
  handleUploadChunk
);

// 合并分片
router.post("/upload/complete", handleUploadComplete);

export default router;
