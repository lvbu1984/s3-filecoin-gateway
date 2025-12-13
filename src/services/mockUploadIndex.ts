// src/services/mockUploadIndex.ts
import fs from "fs";
import path from "path";
import { mockStore } from "./mockStore";
import type { UploadSession } from "../models/types";

const PROJECT_ROOT = path.resolve(__dirname, "../..");
const UPLOAD_ROOT = path.resolve(process.env.MOCK_UPLOAD_DIR || path.join(PROJECT_ROOT, "mock_uploads"));
const INDEX_FILE = path.resolve(process.env.MOCK_UPLOAD_INDEX_FILE || path.join(UPLOAD_ROOT, "index.jsonl"));

type CompletedUploadIndexLine = {
  type: "upload_completed";
  at: number;
  uploadId: string;
  cid: string;
  filename: string;
  totalSize: number;
  chunkSize: number;
  totalChunks: number;
};

function readLines(): string[] {
  if (!fs.existsSync(INDEX_FILE)) return [];
  return fs.readFileSync(INDEX_FILE, "utf8").split("\n").filter(Boolean);
}

export function findCompletedUploadByCid(cid: string): UploadSession | undefined {
  // 1) ✅ 先查内存（最快）
  for (const s of mockStore.uploads.values()) {
    if (s.status === "COMPLETED" && s.cid === cid) return s;
  }

  // 2) ✅ 再查落盘索引（重启后仍可用）
  const lines = readLines();
  for (let i = lines.length - 1; i >= 0; i--) {
    let obj: CompletedUploadIndexLine | any;
    try {
      obj = JSON.parse(lines[i]);
    } catch {
      continue;
    }

    if (obj?.type === "upload_completed" && obj.cid === cid) {
      const pseudo: UploadSession = {
        uploadId: obj.uploadId,
        filename: obj.filename,
        totalSize: obj.totalSize,
        chunkSize: obj.chunkSize,
        totalChunks: obj.totalChunks,
        receivedChunks: new Set<number>(),
        status: "COMPLETED",
        createdAt: obj.at,
        updatedAt: obj.at,
        dir: path.join(UPLOAD_ROOT, obj.uploadId),
        cid: obj.cid,
      };
      return pseudo;
    }
  }

  return undefined;
}

/**
 * ✅ 列出所有已完成上传（来自 index.jsonl，去重：同一 cid 取最新一条）
 */
export function listCompletedUploads(): Array<{
  at: number;
  uploadId: string;
  cid: string;
  filename: string;
  totalSize: number;
  chunkSize: number;
  totalChunks: number;
}> {
  const lines = readLines();

  // cid -> latest
  const map = new Map<string, CompletedUploadIndexLine>();

  for (const line of lines) {
    let obj: CompletedUploadIndexLine | any;
    try {
      obj = JSON.parse(line);
    } catch {
      continue;
    }
    if (obj?.type !== "upload_completed") continue;
    if (typeof obj.cid !== "string" || typeof obj.uploadId !== "string" || typeof obj.at !== "number") continue;

    const prev = map.get(obj.cid);
    if (!prev || obj.at >= prev.at) {
      map.set(obj.cid, obj);
    }
  }

  return Array.from(map.values())
    .map((x) => ({
      at: x.at,
      uploadId: x.uploadId,
      cid: x.cid,
      filename: x.filename,
      totalSize: x.totalSize,
      chunkSize: x.chunkSize,
      totalChunks: x.totalChunks,
    }))
    .sort((a, b) => b.at - a.at);
}
