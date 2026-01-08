// src/store/deal.store.ts
export type DealPhase = "SEALING" | "ACTIVE" | "FAILED";

export type DealRecord = {
  dealId: string;
  cid: string;

  status: DealPhase;
  statusUpdatedAt: number;

  createdAt: number;

  // 可选：失败原因
  lastError?: string;
};

const deals = new Map<string, DealRecord>();

export function upsertDeal(rec: DealRecord) {
  deals.set(rec.dealId, rec);
}

export function getDeal(dealId: string) {
  return deals.get(dealId);
}

export function listDeals() {
  // 最新的在前
  return Array.from(deals.values()).sort((a, b) => b.createdAt - a.createdAt);
}

export function updateDealStatus(dealId: string, next: Partial<DealRecord>) {
  const cur = deals.get(dealId);
  if (!cur) return;
  deals.set(dealId, { ...cur, ...next });
}
