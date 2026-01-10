import { Request, Response } from "express";

const now = () => Date.now();

/**
 * GET /api/dashboard/overview
 */
export function getDashboardOverview(req: Request, res: Response) {
  res.json({
    status: "ok",
    health: {
      overall: "unknown",
      xBackend: "online",
      xStorage: "unknown",
    },
    capacity: {
      totalGB: 0,
      usedGB: 0,
      freeGB: 0,
      usedPercent: 0,
    },
    timestamp: now(),
  });
}

/**
 * GET /api/dashboard/files/summary
 */
export function getFilesSummary(req: Request, res: Response) {
  res.json({
    files: {
      totalFiles: 0,
      totalDataGB: 0,
    },
    timestamp: now(),
  });
}

/**
 * GET /api/dashboard/tasks/summary
 */
export function getTasksSummary(req: Request, res: Response) {
  res.json({
    tasks: {
      active: 0,
      failed: 0,
    },
    timestamp: now(),
  });
}

/**
 * GET /api/dashboard/analytics/users
 */
export function getAnalyticsUsers(req: Request, res: Response) {
  res.json({
    users: {
      totalUniqueWallets: 0,
    },
    timestamp: now(),
  });
}

/**
 * GET /api/dashboard/analytics/regions
 */
export function getAnalyticsRegions(req: Request, res: Response) {
  res.json({
    regions: {
      top: [],
      unknown: 0,
    },
    timestamp: now(),
  });
}

/**
 * GET /api/dashboard/analytics/file-sizes
 */
export function getAnalyticsFileSizes(req: Request, res: Response) {
  res.json({
    fileSizes: {
      medianBytes: 0,
      p90Bytes: 0,
      p95Bytes: 0,
      buckets: [],
    },
    timestamp: now(),
  });
}
