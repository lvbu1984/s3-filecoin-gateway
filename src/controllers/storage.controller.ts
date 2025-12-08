// src/controllers/storage.controller.ts
import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import {
  listFileRecords,
  deleteFileRecord,
  getFileRecord,
} from "../fileStore";
import { UPLOAD_MERGED_DIR } from "../config";

/**
 * GET /api/storage/files
 * 返回所有文件记录
 */
export async function listFilesHandler(req: Request, res: Response) {
  try {
    const files = listFileRecords();
    return res.json({ files });
  } catch (err: any) {
    console.error("listFilesHandler error:", err);
    return res.status(500).json({ error: "Failed to list files" });
  }
}

/**
 * GET /api/storage/files/:id/download
 * 下载对应文件
 */
export async function downloadFileHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const record = getFileRecord(id);
    if (!record) {
      return res.status(404).json({ error: "File record not found" });
    }

    const filePath = path.join(UPLOAD_MERGED_DIR, `${id}-${record.filename}`);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found on disk" });
    }

    return res.download(filePath, record.filename);
  } catch (err: any) {
    console.error("downloadFileHandler error:", err);
    return res.status(500).json({ error: "Failed to download file" });
  }
}

/**
 * DELETE /api/storage/files/:id
 * 删除记录 + 尝试删除本地文件
 */
export async function deleteFileHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const record = deleteFileRecord(id);
    if (!record) {
      return res.status(404).json({ error: "File record not found" });
    }

    const filePath = path.join(UPLOAD_MERGED_DIR, `${id}-${record.filename}`);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (e) {
        console.warn("Failed to remove file:", e);
      }
    }

    return res.json({ ok: true });
  } catch (err: any) {
    console.error("deleteFileHandler error:", err);
    return res.status(500).json({ error: "Failed to delete file" });
  }
}
