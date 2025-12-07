// src/controllers/storage.controller.ts
import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { UPLOAD_ROOT } from "../services/upload.service";
import { uploadToMK20 } from "../api/mk20";

const DEAL_DB_PATH = path.join(process.cwd(), "deal.json");

type StoredFileRecord = {
  id: string; // 本地 UploadId
  filename: string;
  sizeBytes: number;
  cid?: string;
  status: string;
  note?: string;
  createdAt: string;
};

// 简单 JSON “数据库”
function loadDb(): StoredFileRecord[] {
  if (!fs.existsSync(DEAL_DB_PATH)) return [];
  try {
    const raw = fs.readFileSync(DEAL_DB_PATH, "utf-8");
    const data = JSON.parse(raw);
    if (Array.isArray(data)) return data;
    return [];
  } catch {
    return [];
  }
}

function saveDb(list: StoredFileRecord[]) {
  fs.writeFileSync(DEAL_DB_PATH, JSON.stringify(list, null, 2), "utf-8");
}

// ========== 1. 接收分片 ==========

export function uploadChunk(req: Request, res: Response) {
  const file = req.file;
  const { index, fileName } = req.body;

  if (!file || !fileName) {
    return res.status(400).json({ ok: false, message: "缺少文件或文件名" });
  }

  console.log(`[upload/chunk] ${fileName} chunk ${index} -> ${file.path}`);
  res.json({ ok: true });
}

// ========== 2. 合并分片并（可选）上传 MK20 ==========

export async function mergeChunksAndUpload(req: Request, res: Response) {
  const { fileName, totalChunks } = req.body as {
    fileName?: string;
    totalChunks?: number;
  };

  console.log("[upload/complete] raw body =", req.body);

  if (!fileName || typeof totalChunks === "undefined") {
    return res
      .status(400)
      .json({ ok: false, message: "缺少 fileName 或 totalChunks" });
  }

  const chunksDir = path.join(UPLOAD_ROOT, fileName);
  if (!fs.existsSync(chunksDir)) {
    return res
      .status(400)
      .json({ ok: false, message: "找不到对应的分片目录" });
  }

  const mergedPath = path.join(chunksDir, `${fileName}.merged`);

  console.log(
    `[upload/complete] start merge ${fileName} chunks = ${totalChunks}`
  );

  const writeStream = fs.createWriteStream(mergedPath);

  try {
    for (let i = 0; i < Number(totalChunks); i++) {
      const chunkPath = path.join(chunksDir, `chunk_${i}`);
      if (!fs.existsSync(chunkPath)) {
        throw new Error(`缺少分片文件: chunk_${i}`);
      }
      const data = fs.readFileSync(chunkPath);
      writeStream.write(data);
    }
  } catch (err: any) {
    writeStream.close();
    console.error("[upload/complete] merge error", err);
    return res.status(500).json({
      ok: false,
      message: "合并分片失败",
      error: err?.message || String(err),
    });
  } finally {
    writeStream.end();
  }

  const stat = fs.statSync(mergedPath);
  const sizeBytes = stat.size;
  const uploadId = uuidv4();

  console.log(
    `[upload/complete] merged ${fileName}, size = ${sizeBytes} bytes, localUploadId = ${uploadId}`
  );

  const record: StoredFileRecord = {
    id: uploadId,
    filename: fileName,
    sizeBytes,
    status: "pending",
    note: "本地合并完成，等待上传 MK20",
    createdAt: new Date().toISOString(),
  };

  let db = loadDb();
  db.push(record);

  // ===== 可选：真实推 MK20（现在你那边域名还没通，失败也没关系）=====
  try {
    console.log("[upload/complete] pushing to MK20...");
    const mk20Result = await uploadToMK20(mergedPath, { filename: fileName });

    record.status = "mk20_uploaded";
    if (mk20Result.cid) record.cid = mk20Result.cid;
    record.note =
      mk20Result.note ||
      "已推送到 MK20（具体结果请在 MK20 控制台或 Curio/MK20 控制台查看）";
  } catch (err: any) {
    console.warn(
      "[upload/complete] MK20 upload failed:",
      err?.message || err
    );
    record.status = "mk20_failed";
    record.note = `MK20 上传失败：${err?.message || String(err)}`;
  }

  db = db.map((x) => (x.id === record.id ? record : x));
  saveDb(db);

  return res.json({
    ok: true,
    uploadId,
    filename: fileName,
    sizeBytes,
    cid: record.cid || null,
    status: record.status,
    note: record.note,
  });
}

// ========== 3. 列出文件记录 ==========

export function listFiles(req: Request, res: Response) {
  const db = loadDb();
  return res.json({
    ok: true,
    files: db,
  });
}

// ========== 4. 删除文件记录 ==========

export function deleteFile(req: Request, res: Response) {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ ok: false, message: "缺少 id" });
  }

  const db = loadDb();
  const item = db.find((x) => x.id === id);
  if (!item) {
    return res.status(404).json({ ok: false, message: "未找到对应记录" });
  }

  const newDb = db.filter((x) => x.id !== id);
  saveDb(newDb);

  return res.json({ ok: true });
}

// ========== 5. Demo：创建本地 Deal 记录 ==========

export function createDemoDeal(req: Request, res: Response) {
  const { uploadId } = req.params;
  const { durationDays, replicas, minerIds } = req.body || {};

  console.log("[deal] incoming =", {
    uploadId,
    durationDays,
    replicas,
    minerIds,
  });

  const db = loadDb();
  const idx = db.findIndex((r) => r.id === uploadId);

  const dealId = `demo-deal-${Date.now()}`;

  if (idx >= 0) {
    db[idx].status = "deal_created";
    db[idx].note = `Demo：本地创建存储 Deal 记录（duration=${durationDays}, replicas=${replicas}）`;
    saveDb(db);

    return res.json({
      ok: true,
      uploadId,
      dealId,
      cid: db[idx].cid || null,
      status: db[idx].status,
      note: db[idx].note,
    });
  }

  // 即使没找到记录，也返回 200，避免前端报错 —— 只是标记一下
  return res.json({
    ok: true,
    uploadId,
    dealId,
    status: "deal_created",
    note: "Demo：未在本地找到 upload 记录，但仍假定 Deal 创建成功",
  });
}
