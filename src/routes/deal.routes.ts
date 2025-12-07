import { Router } from "express";
import { createDeal } from "../controllers/deal.controller";

const router = Router();

// POST /api/deal/create
router.post("/create", createDeal);

export default router;
