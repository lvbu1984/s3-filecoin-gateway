import { Router } from "express";
import {
  getDashboardOverview,
  getFilesSummary,
  getTasksSummary,
  getAnalyticsUsers,
  getAnalyticsRegions,
  getAnalyticsFileSizes,
} from "../controllers/dashboard.controller";

const router = Router();

/**
 * Core overview & KPIs
 */
router.get("/overview", getDashboardOverview);
router.get("/files/summary", getFilesSummary);
router.get("/tasks/summary", getTasksSummary);

/**
 * Analytics
 */
router.get("/analytics/users", getAnalyticsUsers);
router.get("/analytics/regions", getAnalyticsRegions);
router.get("/analytics/file-sizes", getAnalyticsFileSizes);

export default router;
