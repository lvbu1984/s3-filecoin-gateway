// src/controllers/deal.controller.ts
import { Request, Response } from "express";
import fs from "fs";
import path from "path";

// 和 storage.controller.ts 里用的是同一个 JSON “数据库”
const DEAL_DB_PATH = path.join(process.cwd(), "deal.json");

type StoredFileRecord = {
  id: string;          // 本地 UploadId
  filename: string;
  sizeBytes: number;
  cid?: string;
  status: string;
  note?: string;
  createdAt: string;
};

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

// POST /api/deal/create
export async function createDeal(req: Request, res: Response) {
  const { uploadId, durationDays, replicas, minerIds } = req.body || {};

  console.log("[deal/create] body =", req.body);

  // 只做最基本的校验：必须有 uploadId
  if (!uploadId) {
    return res
      .status(400)
      .json({ ok: false, message: "缺少 uploadId（前端应该传 uploadId）" });
  }

  let db = loadDb();
  const idx = db.findIndex((x) => x.id === uploadId);

  const dealId = `demo-deal-${String(uploadId).slice(0, 8)}`;

  if (idx >= 0) {
    // 找到之前 upload 记录，就在上面补充 Deal 信息
    const rec = db[idx];

    rec.status = "deal_created";
    rec.note = `Demo Deal 已创建：${dealId}，副本=${replicas ?? "-"}，矿工=${Array.isArray(
      minerIds
    )
      ? minerIds.join(",")
      : "-"}`;

    db[idx] = rec;
    saveDb(db);

    return res.json({
      ok: true,
      dealId,
      uploadId,
      filename: rec.filename,
      sizeBytes: rec.sizeBytes,
      cid: rec.cid ?? null,
      status: rec.status,
      note: rec.note,
    });
  }

  // 没找到 upload 记录，也不要 400，直接创建一条新 Demo 记录
  const now = new Date().toISOString();
  const newRec: StoredFileRecord = {
    id: uploadId,
    filename: "unknown",
    sizeBytes: 0,
    status: "deal_created",
    note: `Demo Deal ${dealId}（未找到对应的 upload 记录）`,
    createdAt: now,
  };

  db.push(newRec);
  saveDb(db);

  return res.json({
    ok: true,
    dealId,
    uploadId,
    filename: newRec.filename,
    sizeBytes: newRec.sizeBytes,
    cid: null,
    status: newRec.status,
    note: newRec.note,
  });
}
