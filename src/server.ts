// src/server.ts
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";

import storageRoutes from "./routes/storage.routes";
import marketRoutes from "./routes/market.routes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// ====== 全局中间件 ======
app.use(cors());
app.use(express.json());

// ====== 启动时输出 MK20 配置状态 ======
const mk20BaseUrl = process.env.MK20_BASE_URL;

if (!mk20BaseUrl) {
  console.warn(
    "[mk20] MK20_BASE_URL is not set. Please configure it in your .env file."
  );
  console.warn(
    "[VaultX] MK20_BASE_URL is not set. Using demo config; Curio is not connected yet."
  );
} else {
  console.log(`[mk20] Using MK20_BASE_URL = ${mk20BaseUrl}`);
}

// ====== 系统 / 健康检查相关接口 ======

// 简单健康检查
app.get("/api/health", (req: Request, res: Response) => {
  const mk20BaseUrl = process.env.MK20_BASE_URL || null;
  const hasApiKey = Boolean(process.env.MK20_API_KEY);

  res.json({
    status: "ok",
    service: "VaultX API",
    timestamp: new Date().toISOString(),
    mk20: {
      baseUrl: mk20BaseUrl,
      configured: Boolean(mk20BaseUrl),
      hasApiKey,
    },
  });
});

// 查看 Curio / MK20 配置（给前端 / 调试用）
app.get("/api/config/curio", (req: Request, res: Response) => {
  const mk20BaseUrl = process.env.MK20_BASE_URL || null;
  const hasApiKey = Boolean(process.env.MK20_API_KEY);

  res.json({
    mk20BaseUrl,
    hasMk20ApiKey: hasApiKey,
    note:
      "Configure MK20_BASE_URL and MK20_API_KEY in your .env file to connect Curio.",
  });
});

// ====== 业务路由挂载 ======
app.use("/api/storage", storageRoutes);
app.use("/api/market", marketRoutes);

// ====== 404 处理 ======
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: "Not found",
    path: req.path,
  });
});

// ====== 全局错误处理 ======
app.use(
  (
    err: any,
    req: Request,
    res: Response,
    _next: NextFunction // 不使用也没关系
  ) => {
    console.error("[VaultX] Unhandled error:", err);
    res.status(500).json({
      error: "Internal server error",
      message: err?.message || "Unknown error",
    });
  }
);

// ====== 启动服务 ======
app.listen(PORT, () => {
  console.log(`VaultX API listening on http://localhost:${PORT}`);
});

export default app;
