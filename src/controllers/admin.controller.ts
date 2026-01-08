// src/controllers/admin.controller.ts
import { Request, Response } from "express";
import { listDeals } from "../store/deal.store";

/**
 * Admin · Overview
 */
export function getAdminOverview(req: Request, res: Response) {
  res.json({
    status: "ok",
    system: {
      storage: "online",
      fwss: "connected",
      curio: "idle",
    },
    stats: {
      totalFiles: 0,
      totalSizeGB: 0,
      activeDeals: 0,
    },
    timestamp: Date.now(),
  });
}

/**
 * Admin · Files
 * ⚠️ 先返回最小可用结构，保证接口可用
 * 后续我们会接真实 storage 数据
 */
export function getAdminFiles(req: Request, res: Response) {
  res.json({
    totalFiles: 0,
    totalSizeGB: 0,
    byStatus: {
      stored: 0,
      uploading: 0,
      failed: 0,
    },
  });
}

/**
 * Admin · Deals
 * 只读 deal.store，用于 dashboard 观察
 */
export function getAdminDeals(req: Request, res: Response) {
  const deals = listDeals();

  const totalDeals = deals.length;

  const byStatus: Record<string, number> = {};
  for (const d of deals) {
    byStatus[d.status] = (byStatus[d.status] || 0) + 1;
  }

  const recent = deals.slice(0, 10).map((d) => ({
    dealId: d.dealId,
    cid: d.cid,
    status: d.status,
    createdAt: d.createdAt,
    statusUpdatedAt: d.statusUpdatedAt,
    lastError: d.lastError,
  }));

  res.json({
    totalDeals,
    byStatus,
    recent,
    timestamp: Date.now(),
  });
}
