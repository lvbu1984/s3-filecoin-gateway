// src/controllers/admin.controller.ts
import { Request, Response } from "express";
import { listDeals } from "../store/deal.store";
import { listFiles } from "../store/file.store";

/**
 * Admin · Overview
 * 系统总览（只读事实层）
 */
export function getAdminOverview(req: Request, res: Response) {
  const files = listFiles();

  const totalFiles = files.length;
  const totalSizeBytes = files.reduce((sum, f) => sum + f.size, 0);
  const totalSizeGB = totalSizeBytes / (1024 * 1024 * 1024);

  res.json({
    status: "ok",
    system: {
      storage: "online",
      fwss: "connected",
      curio: "idle",
    },
    stats: {
      totalFiles,
      totalSizeGB,
      activeDeals: 0,
    },
    timestamp: Date.now(),
  });
}

/**
 * Admin · Files
 * 文件事实统计（来源：file.store）
 */
export function getAdminFiles(req: Request, res: Response) {
  const files = listFiles();

  const totalFiles = files.length;
  const totalSizeBytes = files.reduce((sum, f) => sum + f.size, 0);
  const totalSizeGB = totalSizeBytes / (1024 * 1024 * 1024);

  const byStatus: Record<string, number> = {
    stored: 0,
    uploading: 0,
    failed: 0,
  };

  for (const f of files) {
    if (byStatus[f.status] !== undefined) {
      byStatus[f.status]++;
    }
  }

  res.json({
    totalFiles,
    totalSizeGB,
    byStatus,
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
