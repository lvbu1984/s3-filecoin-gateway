// src/index.ts
import express from "express";
import cors from "cors";

import adminRoutes from "./routes/admin.routes";

const app = express();
const PORT = 4000;

/**
 * 基础中间件
 */
app.use(cors());
app.use(express.json());

/**
 * Admin API
 */
app.use("/api/admin", adminRoutes);

/**
 * ===============================
 * ⚠️ 开发阶段：注入一条测试 file
 * 目的：验证 Admin 0 → 1 的完整链路
 * ===============================
 */
addFile({
  fileId: "file_test_001",
  filename: "hello.txt",
  size: 12, // bytes
  status: "stored",
});

/**
 * 启动服务
 */
app.listen(PORT, () => {
  console.log(`vaultx-api listening on http://0.0.0.0:${PORT}`);
});
