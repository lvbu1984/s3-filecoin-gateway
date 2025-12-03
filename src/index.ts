// src/index.ts
// 后端 · vaultx-api
import express from "express";
import cors from "cors";
import storageRoutes from "./routes/storage.routes";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ ok: true, service: "vaultx-api", time: new Date().toISOString() });
});

// 文件上传相关 API
app.use("/api/storage", storageRoutes);

// 以后可以继续挂：/api/market, /api/deals 等
export default app;
