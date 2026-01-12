// src/server.ts
// VaultX 后端 · 唯一启动入口（冻结）

import "dotenv/config";
import app from "./index";

console.log(">>> REAL server.ts LOADED <<<", __filename);

const PORT = 4000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`vaultx-api listening on http://0.0.0.0:${PORT}`);
});
