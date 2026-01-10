// src/index.ts
// VaultX 后端 · 唯一 Express App 定义处（冻结）

import express from "express";
import cors from "cors";

import adminRoutes from "./routes/admin.routes";
import uploadRoutes from "./routes/upload.routes";
import dealRoutes from "./routes/deal.routes";
import storageRoutes from "./routes/storage.routes";
import dashboardRoutes from "./routes/dashboard.routes";

console.log(">>> REAL index.ts LOADED <<<", __filename);

const app = express();

app.use(cors());
app.use(express.json());

// 健康检查
app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    service: "vaultx-api",
    time: new Date().toISOString(),
  });
});

// ===== API 挂载（唯一位置） =====
app.use("/api/admin", adminRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/deal", dealRoutes);
app.use("/api/storage", storageRoutes);

// X 仪表盘（只读）
app.use("/api/dashboard", dashboardRoutes);

export default app;
