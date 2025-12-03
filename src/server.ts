// src/server.ts
// 后端 · vaultx-api
import "dotenv/config";
import app from "./index";

const PORT = process.env.PORT || 4000;

// 👇 新增：启动时打印 MK20 配置，方便确认 .env 是否生效
console.log("[env] PORT =", PORT);
console.log("[env] MK20_BASE_URL =", process.env.MK20_BASE_URL);
console.log(
  "[env] MK20_API_KEY prefix =",
  process.env.MK20_API_KEY?.slice(0, 6) || "(not set)"
);

app.listen(PORT, () => {
  console.log(`vaultx-api listening on http://localhost:${PORT}`);
});

