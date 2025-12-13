import { Router } from "express";
import multer from "multer";
import { uploadChunk, uploadComplete, uploadInit, uploadList, uploadStatus } from "../controllers/upload.controller";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/init", uploadInit);
router.post("/chunk", upload.single("file"), uploadChunk);
router.post("/complete", uploadComplete);
router.get("/status", uploadStatus);

// ✅ 新增：落盘恢复的 completed uploads 列表
router.get("/list", uploadList);

export default router;
