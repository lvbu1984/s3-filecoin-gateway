// src/services/upload.service.ts
import multer from "multer";
import fs from "fs";
import path from "path";
import os from "os";

// 上传根目录：系统临时目录下的 vaultx_uploads
export const UPLOAD_ROOT = path.join(os.tmpdir(), "vaultx_uploads");

// 确保目录存在
if (!fs.existsSync(UPLOAD_ROOT)) {
  fs.mkdirSync(UPLOAD_ROOT, { recursive: true });
}

// 使用 diskStorage，根据 fileName 建子目录，根据 index 命名分片
const storage = multer.diskStorage({
  destination(req, file, cb) {
    // 前端在 formData 里传了 fileName
    const rawName = (req.body?.fileName as string) || "blob";
    // 防止文件名里有 / 或 \
    const safeName = rawName.replace(/[\/\\]/g, "_");

    const dir = path.join(UPLOAD_ROOT, safeName);
    fs.mkdirSync(dir, { recursive: true });

    cb(null, dir);
  },
  filename(req, file, cb) {
    const index = (req.body?.index as string) ?? "0";
    cb(null, `chunk_${index}`);
  },
});

// 导出给路由用
export const uploadMiddleware = multer({ storage });
