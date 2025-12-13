import { Router } from "express";
import { createDeal, dealList, dealStatus } from "../controllers/deal.controller";

const router = Router();

router.post("/create", createDeal);
router.get("/status", dealStatus);
router.get("/list", dealList);

export default router;
