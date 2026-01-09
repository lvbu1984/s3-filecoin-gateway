import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

/**
 * 临时上传目录（进程级，chunk 暂存）
 * ⚠️ 重启会丢，但这是“封装前测试阶段”可接受的
 */
const TMP_ROOT = "/tmp/vaultx-upload";

/**
 * 最终真实存储目录（你已确认存在且可写）
 */
const FWSS_ROOT = "/mnt/md2/fwss/uploads";

/**
 * 确保目录存在
 */
function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * upload/init
 * 初始化一次 upload，会返回 uploadId
 */
export function initUpload(req: Request, res: Response) {
  const { filename, totalSize } = req.body;

  if (!filename || typeof filename !== "string") {
    return res.status(400).json({ error: "invalid filename" });
  }

  const uploadId = uuidv4();

  const uploadTmpDir = path.join(TMP_ROOT, uploadId);
  ensureDir(uploadTmpDir);

  res.json({
    uploadId,
    filename,
    totalSize,
    status: "uploading",
  });
}

/**
 * upload/chunk
 * 接收一个 chunk（当前按“整文件一个 chunk”使用）
 * multer 已在 route 层处理
 */
export function uploadChunk(req: Request, res: Response) {
  const { uploadId } = req.body;
  const file = (req as any).file;

  if (!uploadId) {
    return res.status(400).json({ error: "missing uploadId" });
  }

  if (!file) {
    return res.status(400).json({ error: "missing file" });
  }

  const uploadTmpDir = path.join(TMP_ROOT, uploadId);

  if (!fs.existsSync(uploadTmpDir)) {
    return res.status(404).json({ error: "uploadId not found" });
  }

  const targetPath = path.join(uploadTmpDir, file.originalname);

  fs.writeFileSync(targetPath, file.buffer);

  res.json({ ok: true });
}

/**
 * upload/complete
 * 核心：把临时目录中的文件，真实写入 FWSS 存储目录
 */
export function completeUpload(req: Request, res: Response) {
  const { uploadId } = req.body;

  if (!uploadId) {
    return res.status(400).json({ error: "missing uploadId" });
  }

  const uploadTmpDir = path.join(TMP_ROOT, uploadId);

  if (!fs.existsSync(uploadTmpDir)) {
    return res.status(404).json({
      error: "temp upload directory not found",
      uploadId,
    });
  }

  const files = fs.readdirSync(uploadTmpDir);

  if (files.length === 0) {
    return res.status(400).json({
      error: "no uploaded files",
      uploadId,
    });
  }

  const finalDir = path.join(FWSS_ROOT, uploadId);
  ensureDir(finalDir);

  const storedFiles: string[] = [];

  for (const file of files) {
    const src = path.join(uploadTmpDir, file);
    const dst = path.join(finalDir, file);

    fs.copyFileSync(src, dst);
    storedFiles.push(dst);
  }

  /**
   * ⚠️ 这里明确：
   * - 不封装扇区
   * - 不上链
   * - 返回一个“准真实 CID”
   */
  const cid = `local-${uploadId}`;

  res.json({
    ok: true,
    uploadId,
    cid,
    storedAt: finalDir,
    files: storedFiles,
  });
}

/**
 * upload/status（可选，给 admin / 前端用）
 */
export function getUploadStatus(req: Request, res: Response) {
  const { uploadId } = req.query as { uploadId?: string };

  if (!uploadId) {
    return res.status(400).json({ error: "missing uploadId" });
  }

  const finalDir = path.join(FWSS_ROOT, uploadId);

  if (fs.existsSync(finalDir)) {
    return res.json({ status: "stored" });
  }

  const tmpDir = path.join(TMP_ROOT, uploadId);
  if (fs.existsSync(tmpDir)) {
    return res.json({ status: "uploading" });
  }

  res.json({ status: "unknown" });
}
