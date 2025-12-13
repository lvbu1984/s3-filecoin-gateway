// src/controllers/deal.controller.ts
import { Request, Response } from "express";
import { getStorageProviderAdapter } from "../adapters";

export async function createDeal(req: Request, res: Response) {
  try {
    const { cid } = req.body || {};
    if (!cid) return res.status(400).json({ error: "cid required" });

    const adapter = getStorageProviderAdapter();
    const out = await adapter.createDeal({ cid: String(cid) });

    return res.json(out);
  } catch (e: any) {
    const code = e?.statusCode ? Number(e.statusCode) : 500;
    return res.status(code).json({ error: e?.message || "create deal failed" });
  }
}

export async function dealStatus(req: Request, res: Response) {
  try {
    const dealId = String(req.query.dealId || "");
    if (!dealId) return res.status(400).json({ error: "dealId required" });

    const adapter = getStorageProviderAdapter();
    const out = await adapter.getDealStatus(dealId);

    return res.json(out);
  } catch (e: any) {
    const code = e?.statusCode ? Number(e.statusCode) : 404;
    return res.status(code).json({ error: e?.message || "not found" });
  }
}

/**
 * GET /api/deal/list
 * 可选 query:
 *  - q: string（按 dealId 或 cid 模糊匹配，大小写不敏感）
 *  - limit: number（默认 50，最大 200）
 *  - offset: number（默认 0）
 *
 * 返回结构不变：{ items: [...] }
 */
export async function dealList(req: Request, res: Response) {
  try {
    const adapter = getStorageProviderAdapter();
    const out = await adapter.listDeals();

    const rawItems = Array.isArray((out as any)?.items) ? (out as any).items : [];

    const q = String(req.query.q || "").trim().toLowerCase();

    let limit = Number(req.query.limit ?? 50);
    let offset = Number(req.query.offset ?? 0);

    if (!Number.isFinite(limit) || limit <= 0) limit = 50;
    if (!Number.isFinite(offset) || offset < 0) offset = 0;
    if (limit > 200) limit = 200;

    let items = rawItems;

    // ✅ 搜索：dealId / cid 模糊匹配
    if (q) {
      items = items.filter((x: any) => {
        const dealId = String(x?.dealId || "").toLowerCase();
        const cid = String(x?.cid || "").toLowerCase();
        return dealId.includes(q) || cid.includes(q);
      });
    }

    // ✅ 分页：offset/limit
    items = items.slice(offset, offset + limit);

    return res.json({ items });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "list failed" });
  }
}
