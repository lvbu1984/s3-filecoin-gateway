// src/routes/storage.routes.ts
import { Router } from "express";
import {
  listFilesHandler,
  downloadFileHandler,
  deleteFileHandler,
} from "../controllers/storage.controller";

const router = Router();

// 文件列表
router.get("/files", listFilesHandler);

// 下载
router.get("/files/:id/download", downloadFileHandler);

// 删除
router.delete("/files/:id", deleteFileHandler);

export default router;
