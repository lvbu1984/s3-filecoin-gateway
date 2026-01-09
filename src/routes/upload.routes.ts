import { Router } from "express";
import multer from "multer";

import {
  initUpload,
  uploadChunk,
  completeUpload,
  getUploadStatus,
} from "../controllers/upload.controller";

const router = Router();
const upload = multer();

/**
 * 初始化 upload
 */
router.post("/init", initUpload);

/**
 * 上传 chunk（当前阶段：整文件一个 chunk）
 */
router.post("/chunk", upload.single("file"), uploadChunk);

/**
 * 完成 upload → 写入 /mnt/md2/fwss/uploads
 */
router.post("/complete", completeUpload);

/**
 * 查询 upload 状态（可选）
 */
router.get("/status", getUploadStatus);

export default router;
