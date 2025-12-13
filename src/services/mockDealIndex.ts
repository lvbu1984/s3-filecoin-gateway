import fs from "fs";
import path from "path";

// __dirname = <project>/src/services
const PROJECT_ROOT = path.resolve(__dirname, "../..");
const UPLOAD_ROOT = path.resolve(process.env.MOCK_UPLOAD_DIR || path.join(PROJECT_ROOT, "mock_uploads"));
const DEAL_INDEX_FILE = path.resolve(process.env.MOCK_DEAL_INDEX_FILE || path.join(UPLOAD_ROOT, "deals.jsonl"));

type DealCreatedLine = {
  type: "deal_created";
  at: number;
  cid: string;
  dealId: string;
};

function ensureDir(p: string) {
  fs.mkdirSync(p, { recursive: true });
}

function readLines(): string[] {
  if (!fs.existsSync(DEAL_INDEX_FILE)) return [];
  return fs.readFileSync(DEAL_INDEX_FILE, "utf8").split("\n").filter(Boolean);
}

export function findDealIdByCid(cid: string): string | undefined {
  const lines = readLines();
  for (let i = lines.length - 1; i >= 0; i--) {
    let obj: DealCreatedLine | any;
    try {
      obj = JSON.parse(lines[i]);
    } catch {
      continue;
    }
    if (obj?.type === "deal_created" && obj.cid === cid && typeof obj.dealId === "string") {
      return obj.dealId;
    }
  }
  return undefined;
}

export function findCidByDealId(dealId: string): string | undefined {
  const lines = readLines();
  for (let i = lines.length - 1; i >= 0; i--) {
    let obj: DealCreatedLine | any;
    try {
      obj = JSON.parse(lines[i]);
    } catch {
      continue;
    }
    if (obj?.type === "deal_created" && obj.dealId === dealId && typeof obj.cid === "string") {
      return obj.cid;
    }
  }
  return undefined;
}

export function appendDealBinding(params: { cid: string; dealId: string; at?: number }) {
  ensureDir(UPLOAD_ROOT);
  const line: DealCreatedLine = {
    type: "deal_created",
    at: params.at ?? Date.now(),
    cid: params.cid,
    dealId: params.dealId,
  };
  fs.appendFileSync(DEAL_INDEX_FILE, JSON.stringify(line) + "\n", { encoding: "utf8" });
}

/**
 * ✅ 列出所有已落盘的 deal 绑定（去重：同一 dealId 取最新一条）
 */
export function listDealBindings(): Array<{ dealId: string; cid: string; at: number }> {
  const lines = readLines();

  // dealId -> latest
  const map = new Map<string, { dealId: string; cid: string; at: number }>();

  for (const line of lines) {
    let obj: DealCreatedLine | any;
    try {
      obj = JSON.parse(line);
    } catch {
      continue;
    }
    if (obj?.type !== "deal_created") continue;
    if (typeof obj.dealId !== "string" || typeof obj.cid !== "string" || typeof obj.at !== "number") continue;

    const prev = map.get(obj.dealId);
    if (!prev || obj.at >= prev.at) {
      map.set(obj.dealId, { dealId: obj.dealId, cid: obj.cid, at: obj.at });
    }
  }

  return Array.from(map.values()).sort((a, b) => b.at - a.at);
}
