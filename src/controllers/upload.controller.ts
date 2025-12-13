// src/controllers/upload.controller.ts
import { Request, Response } from "express";
import { getStorageProviderAdapter } from "../adapters";

export async function uploadInit(req: Request, res: Response) {
  try {
    const { filename, totalSize, chunkSize } = req.body || {};
    if (!filename || !totalSize || !chunkSize) {
      return res.status(400).json({ error: "filename,totalSize,chunkSize required" });
    }

    const adapter = getStorageProviderAdapter();
    const out = await adapter.initUpload({
      filename: String(filename),
      totalSize: Number(totalSize),
      chunkSize: Number(chunkSize),
    });

    return res.json(out);
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "upload init failed" });
  }
}

export async function uploadChunk(req: Request, res: Response) {
  try {
    const uploadId = String((req.body as any)?.uploadId || "");
    const chunkIndex = Number((req.body as any)?.chunkIndex);

    if (!uploadId || Number.isNaN(chunkIndex)) {
      return res.status(400).json({ error: "uploadId and chunkIndex required" });
    }

    const f = (req as any).file;
    if (!f?.buffer) return res.status(400).json({ error: "file required" });

    const adapter = getStorageProviderAdapter();
    const out = await adapter.uploadChunk({
      uploadId,
      chunkIndex,
      buffer: f.buffer as Buffer,
    });

    return res.json(out);
  } catch (e: any) {
    const code = e?.statusCode ? Number(e.statusCode) : 500;
    return res.status(code).json({ error: e?.message || "upload chunk failed" });
  }
}

export async function uploadComplete(req: Request, res: Response) {
  try {
    const { uploadId } = req.body || {};
    if (!uploadId) return res.status(400).json({ error: "uploadId required" });

    const adapter = getStorageProviderAdapter();
    const out = await adapter.completeUpload({ uploadId: String(uploadId) });

    return res.json(out);
  } catch (e: any) {
    const code = e?.statusCode ? Number(e.statusCode) : 500;
    return res.status(code).json({ error: e?.message || "upload complete failed" });
  }
}

export async function uploadStatus(req: Request, res: Response) {
  try {
    const uploadId = String(req.query.uploadId || "");
    if (!uploadId) return res.status(400).json({ error: "uploadId required" });

    const adapter = getStorageProviderAdapter();
    const out = await adapter.getUploadStatus(uploadId);

    return res.json(out);
  } catch (e: any) {
    const code = e?.statusCode ? Number(e.statusCode) : 404;
    return res.status(code).json({ error: e?.message || "not found" });
  }
}

/**
 * GET /api/upload/list
 * 可选 query:
 *  - q: string（按 filename 或 cid 模糊匹配，大小写不敏感）
 *  - limit: number（默认 50，最大 200）
 *  - offset: number（默认 0）
 *
 * 返回结构不变：{ items: [...] }
 */
export async function uploadList(req: Request, res: Response) {
  try {
    const adapter = getStorageProviderAdapter();
    const out = await adapter.listUploads();

    const rawItems = Array.isArray((out as any)?.items) ? (out as any).items : [];

    const q = String(req.query.q || "").trim().toLowerCase();

    let limit = Number(req.query.limit ?? 50);
    let offset = Number(req.query.offset ?? 0);

    if (!Number.isFinite(limit) || limit <= 0) limit = 50;
    if (!Number.isFinite(offset) || offset < 0) offset = 0;
    if (limit > 200) limit = 200;

    let items = rawItems;

    // ✅ 搜索：filename / cid 模糊匹配
    if (q) {
      items = items.filter((x: any) => {
        const filename = String(x?.filename || "").toLowerCase();
        const cid = String(x?.cid || "").toLowerCase();
        return filename.includes(q) || cid.includes(q);
      });
    }

    // ✅ 分页：offset/limit
    items = items.slice(offset, offset + limit);

    return res.json({ items });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "list failed" });
  }
}
