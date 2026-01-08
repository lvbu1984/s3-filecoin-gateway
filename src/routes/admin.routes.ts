import { Router } from "express";
import {
  getAdminOverview,
  getAdminFiles,
  getAdminDeals
} from "../controllers/admin.controller";

const router = Router();

router.get("/overview", getAdminOverview);
router.get("/files", getAdminFiles);
router.get("/deals", getAdminDeals);

export default router;
