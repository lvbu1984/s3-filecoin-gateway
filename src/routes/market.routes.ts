// src/routes/market.routes.ts

import { Router } from "express";
import {
  getMarketContracts,
  getMarketProducts,
  getMarketSources,
  getMarketMeta,
} from "../controllers/market.controller";

const router = Router();

// 单独的三个列表
router.get("/contracts", getMarketContracts);
router.get("/products", getMarketProducts);
router.get("/sources", getMarketSources);

// 汇总信息
router.get("/meta", getMarketMeta);

export default router;
