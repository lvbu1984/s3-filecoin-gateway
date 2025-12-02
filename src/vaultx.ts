// src/vaultx.ts

// ======================
// 通用类型定义
// ======================

export type ReplicationStrategy = "random" | "manual";

export interface StorageNode {
  id: string;
  label: string;
  reliability: number; // 0~1
  basePriceMultiplier: number; // 价格系数
}

// 这里先写死一个节点池，后面可以改成从 Curio 读取
export const NODE_POOL: StorageNode[] = [
  {
    id: "f03080038",
    label: "Node f03080038 · Hangzhou IDC",
    reliability: 0.998,
    basePriceMultiplier: 1.0,
  },
  {
    id: "f0491919",
    label: "Node f0491919 · Shanghai DC",
    reliability: 0.996,
    basePriceMultiplier: 1.1,
  },
  {
    id: "f0123456",
    label: "Node f0123456 · Backup DC",
    reliability: 0.993,
    basePriceMultiplier: 0.95,
  },
];

// -------- Market 相关类型（供 market.controller 使用） --------

export interface MarketContract {
  id: string;
  name: string;
  description?: string;
}

export interface MarketProduct {
  id: string;
  name: string;
  description?: string;
}

export interface MarketSource {
  id: string;
  name: string;
  description?: string;
}

export interface MarketMeta {
  contracts: MarketContract[];
  products: MarketProduct[];
  sources: MarketSource[];
}

// -------- 报价相关类型 --------

export interface QuoteRequestBody {
  sizeBytes: number; // 文件大小（字节）
  replication: number; // 副本数
  strategy: ReplicationStrategy; // 随机 or 手动
  selectedNodeIds?: string[]; // 手动选择的节点
  dealDurationDays: number; // 合约天数
}

export interface QuoteReplica {
  nodeId: string;
  nodeLabel: string;
  priceFil: number;
  baseFilPerGiBMonth: number;
  adjustedFilPerGiBMonth: number;
  durationDays: number;
}

export interface QuoteResponseBody {
  sizeBytes: number;
  sizeReadable: string;
  replication: number;
  dealDurationDays: number;
  totalFil: number;
  replicas: QuoteReplica[];
}

// ======================
// 工具函数
// ======================

export function humanReadableBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return "0 B";
  const units = ["B", "KiB", "MiB", "GiB", "TiB", "PiB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(2)} ${units[i]}`;
}

// 简单随机挑选若干节点（不重复）
function pickRandomNodes(count: number): StorageNode[] {
  const shuffled = [...NODE_POOL].sort(() => Math.random() - 0.5);
  if (count <= shuffled.length) {
    return shuffled.slice(0, count);
  }
  // 如果副本数 > 节点数，就允许重复
  const result: StorageNode[] = [];
  for (let i = 0; i < count; i++) {
    result.push(shuffled[i % shuffled.length]);
  }
  return result;
}

// 根据手动选择 + 副本数，算出最终要用的节点列表
function resolveNodes(
  replication: number,
  strategy: ReplicationStrategy,
  selectedNodeIds?: string[]
): StorageNode[] {
  if (strategy === "manual" && selectedNodeIds && selectedNodeIds.length > 0) {
    const selected = NODE_POOL.filter((n) =>
      selectedNodeIds.includes(n.id)
    );

    if (selected.length >= replication) {
      return selected.slice(0, replication);
    }

    // 已选不足副本数，用随机节点补满
    const missing = replication - selected.length;
    const others = NODE_POOL.filter((n) => !selectedNodeIds.includes(n.id));
    const extra = pickRandomNodes(Math.min(missing, others.length));
    return [...selected, ...extra];
  }

  // 默认：完全随机
  return pickRandomNodes(replication);
}

// ======================
// 报价核心算法
// ======================

// 基础单价：每 GiB·月 0.001 FIL（纯演示用，后续可以改成从 Curio 读）
const BASE_FIL_PER_GIB_MONTH = 0.001;

export function calculateQuote(req: QuoteRequestBody): QuoteResponseBody {
  const { sizeBytes, replication, strategy, selectedNodeIds, dealDurationDays } =
    req;

  const nodes = resolveNodes(replication, strategy, selectedNodeIds);
  const sizeGiB = sizeBytes / Math.pow(1024, 3);
  const months = dealDurationDays / 30;

  const replicas: QuoteReplica[] = [];
  let totalFil = 0;

  for (const node of nodes) {
    const adjustedUnitPrice =
      BASE_FIL_PER_GIB_MONTH * node.basePriceMultiplier;
    const priceFil = sizeGiB * months * adjustedUnitPrice;
    totalFil += priceFil;

    replicas.push({
      nodeId: node.id,
      nodeLabel: node.label,
      priceFil: Number(priceFil.toFixed(6)),
      baseFilPerGiBMonth: BASE_FIL_PER_GIB_MONTH,
      adjustedFilPerGiBMonth: Number(adjustedUnitPrice.toFixed(6)),
      durationDays: dealDurationDays,
    });
  }

  return {
    sizeBytes,
    sizeReadable: humanReadableBytes(sizeBytes),
    replication,
    dealDurationDays,
    totalFil: Number(totalFil.toFixed(6)),
    replicas,
  };
}
