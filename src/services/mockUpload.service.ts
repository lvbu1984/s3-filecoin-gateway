import path from "path";
import fs from "fs";
import crypto from "crypto";
import { mockStore } from "./mockStore";
import { assertUploadTransition } from "./stateMachine";

const UPLOAD_ROOT = process.env.MOCK_UPLOAD_DIR || path.join(process.cwd(), "mock_uploads");
const INDEX_FILE = process.env.MOCK_UPLOAD_INDEX_FILE || path.join(UPLOAD_ROOT, "index.jsonl");

function ensureDir(p: string) {
  fs.mkdirSync(p, { recursive: true });
}

function now() {
  return Date.now();
}

function appendIndexLine(obj: any) {
  ensureDir(UPLOAD_ROOT);
  fs.appendFileSync(INDEX_FILE, JSON.stringify(obj) + "\n", { encoding: "utf8" });
}

export function initUpload(params: {
  filename: string;
  totalSize: number;
  chunkSize: number;
}) {
  ensureDir(UPLOAD_ROOT);

  const uploadId = crypto.randomUUID();
  const totalChunks = Math.ceil(params.totalSize / params.chunkSize);
  const dir = path.join(UPLOAD_ROOT, uploadId);
  ensureDir(dir);

  const session = {
    uploadId,
    filename: params.filename,
    totalSize: params.totalSize,
    chunkSize: params.chunkSize,
    totalChunks,
    receivedChunks: new Set<number>(),
    status: "INIT" as const,
    createdAt: now(),
    updatedAt: now(),
    dir,
    cid: undefined as string | undefined,
    dealId: undefined as string | undefined,
  };

  mockStore.uploads.set(uploadId, session);

  return {
    uploadId,
    totalChunks,
  };
}

export function saveChunk(params: { uploadId: string; chunkIndex: number; buffer: Buffer }) {
  const s = mockStore.uploads.get(params.uploadId);
  if (!s) throw new Error("uploadId not found");

  if (s.status === "COMPLETED") {
    throw new Error("upload already completed");
  }

  if (params.chunkIndex < 0 || params.chunkIndex >= s.totalChunks) {
    throw new Error("chunkIndex out of range");
  }

  // 状态推进：INIT -> UPLOADING / UPLOADING -> UPLOADING
  assertUploadTransition(s.status, "UPLOADING");

  const chunkPath = path.join(s.dir, `${params.chunkIndex}.part`);
  fs.writeFileSync(chunkPath, params.buffer);

  s.receivedChunks.add(params.chunkIndex);
  s.status = "UPLOADING";
  s.updatedAt = now();

  return {
    received: s.receivedChunks.size,
    total: s.totalChunks,
  };
}

export function completeUpload(params: { uploadId: string }) {
  const s = mockStore.uploads.get(params.uploadId);
  if (!s) throw new Error("uploadId not found");

  if (s.receivedChunks.size !== s.totalChunks) {
    throw new Error(`chunks incomplete: ${s.receivedChunks.size}/${s.totalChunks}`);
  }

  // 状态推进：UPLOADING -> COMPLETED
  assertUploadTransition(s.status, "COMPLETED");

  // 生成 mock CID（sha256 模拟）
  const hash = crypto.createHash("sha256");
  for (let i = 0; i < s.totalChunks; i++) {
    const p = path.join(s.dir, `${i}.part`);
    const buf = fs.readFileSync(p);
    hash.update(buf);
  }
  const digest = hash.digest("hex");
  const cid = `bafy-mock-${digest.slice(0, 46)}`;

  s.status = "COMPLETED";
  s.cid = cid;
  s.updatedAt = now();

  // ✅ 落盘索引：重启后仍能用 cid 校验 upload→deal 边界
  appendIndexLine({
    type: "upload_completed",
    at: s.updatedAt,
    uploadId: s.uploadId,
    cid: s.cid,
    filename: s.filename,
    totalSize: s.totalSize,
    chunkSize: s.chunkSize,
    totalChunks: s.totalChunks,
  });

  return { cid };
}

export function getUploadStatus(uploadId: string) {
  const s = mockStore.uploads.get(uploadId);
  if (!s) throw new Error("uploadId not found");

  return {
    uploadId: s.uploadId,
    filename: s.filename,
    status: s.status,
    receivedChunks: s.receivedChunks.size,
    totalChunks: s.totalChunks,
    cid: s.cid,
    dealId: s.dealId,
  };
}
