// src/controllers/deal.controller.ts
import type { Request, Response } from "express";
import { createDeal as svcCreateDeal, getDealStatus as svcGetDealStatus, getDealList as svcGetDealList } from "../services/mockDeal.service";

export async function createDeal(req: Request, res: Response) {
  try {
    const { cid } = req.body || {};
    if (!cid || typeof cid !== "string") {
      return res.status(400).json({ error: "cid is required" });
    }

    const deal = svcCreateDeal({ cid });

    // 返回结构尽量稳定：前端最少依赖 dealId/status
    return res.json({
      dealId: deal.dealId,
      cid: deal.cid,
      status: deal.status,
      statusUpdatedAt: deal.statusUpdatedAt,
    });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "createDeal failed" });
  }
}

export async function dealStatus(req: Request, res: Response) {
  try {
    const dealId = String(req.query.dealId || "");
    if (!dealId) return res.status(400).json({ error: "dealId is required" });

    const d = svcGetDealStatus(dealId);
    if (!d) return res.status(404).json({ error: "deal not found", dealId });

    return res.json({
      dealId: d.dealId,
      cid: d.cid,
      status: d.status,
      statusUpdatedAt: d.statusUpdatedAt,
      lastError: d.lastError,
    });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "dealStatus failed" });
  }
}

export async function dealList(_req: Request, res: Response) {
  try {
    const items = svcGetDealList();
    return res.json({
      items: items.map((d) => ({
        dealId: d.dealId,
        cid: d.cid,
        status: d.status,
        statusUpdatedAt: d.statusUpdatedAt,
        lastError: d.lastError,
        createdAt: d.createdAt,
      })),
    });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "dealList failed" });
  }
}
