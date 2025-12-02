// src/controllers/market.controller.ts

import { Request, Response } from "express";
import {
  getSupportedContracts,
  getSupportedProducts,
  getSupportedSources,
} from "../api/mk20";

// GET /api/market/contracts
export const getMarketContracts = async (req: Request, res: Response) => {
  try {
    const contracts = await getSupportedContracts();
    return res.json({ contracts });
  } catch (err: any) {
    console.error("[market] getMarketContracts error:", err);
    return res.status(500).json({
      error: "Internal server error",
      message: err?.message ?? "Unknown error",
    });
  }
};

// GET /api/market/products
export const getMarketProducts = async (req: Request, res: Response) => {
  try {
    const products = await getSupportedProducts();
    return res.json({ products });
  } catch (err: any) {
    console.error("[market] getMarketProducts error:", err);
    return res.status(500).json({
      error: "Internal server error",
      message: err?.message ?? "Unknown error",
    });
  }
};

// GET /api/market/sources
export const getMarketSources = async (req: Request, res: Response) => {
  try {
    const sources = await getSupportedSources();
    return res.json({ sources });
  } catch (err: any) {
    console.error("[market] getMarketSources error:", err);
    return res.status(500).json({
      error: "Internal server error",
      message: err?.message ?? "Unknown error",
    });
  }
};

// GET /api/market/meta   一次性返回全部（三个列表）
export const getMarketMeta = async (req: Request, res: Response) => {
  try {
    const [contracts, products, sources] = await Promise.all([
      getSupportedContracts(),
      getSupportedProducts(),
      getSupportedSources(),
    ]);

    return res.json({
      contracts,
      products,
      sources,
    });
  } catch (err: any) {
    console.error("[market] getMarketMeta error:", err);
    return res.status(500).json({
      error: "Internal server error",
      message: err?.message ?? "Unknown error",
    });
  }
};
