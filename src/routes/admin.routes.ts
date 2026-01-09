// src/routes/admin.routes.ts
import { Router } from "express";
import {
  getAdminOverview,
  getAdminFiles,
  getAdminDeals,
} from "../controllers/admin.controller";

const router = Router();

/**
 * Admin · Overview
 */
router.get("/overview", getAdminOverview);

/**
 * Admin · Files
 */
router.get("/files", getAdminFiles);

/**
 * Admin · Deals
 */
router.get("/deals", getAdminDeals);

export default router;
