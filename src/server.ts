// src/server.ts
import express from "express";
import cors from "cors";

import adminRoutes from "./routes/admin.routes";
console.log(">>> REAL server.ts LOADED <<<", __filename);
// 🔥 强制 require admin.routes.ts（只用于排错）
const adminRoutesDebug = require("./routes/admin.routes");
console.log(">>> adminRoutesDebug =", adminRoutesDebug);

import dealRoutes from "./routes/deal.routes";
import uploadRoutes from "./routes/upload.routes";
import storageRoutes from "./routes/storage.routes";   // ← 新增：文件列表 / 下载 / 删除

const app = express();
app.use(cors());
app.use(express.json());

// 路由挂载
app.use("/api/deal", dealRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/storage", storageRoutes);               // ← 必须加上这一行！！！
app.use("/api/admin", adminRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`VaultX API listening on port ${PORT}`);
});
