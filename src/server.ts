// src/server.ts
// 后端 · vaultx-api
import "dotenv/config";
import app from "./index";

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`vaultx-api listening on http://localhost:${PORT}`);
});
