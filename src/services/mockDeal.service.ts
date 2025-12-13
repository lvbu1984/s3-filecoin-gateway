// src/services/mockDeal.service.ts
import crypto from "crypto";
import { mockStore } from "./mockStore";
import type { DealRecord, DealStatus } from "../models/types";
import { assertDealTransition } from "./stateMachine";
import { findCidByDealId, listDealBindings } from "./mockDealIndex";

function now() {
  return Date.now();
}

function pushStatus(d: DealRecord, next: DealStatus) {
  assertDealTransition(d.status, next);

  d.status = next;
  d.updatedAt = now();
  d.timeline = d.timeline || [];
  d.timeline.push({ at: d.updatedAt, status: next });
}

export function createMockDeal(params: { cid: string; filename?: string; size?: number }) {
  const dealId = crypto.randomUUID();

  const d: DealRecord = {
    dealId,
    cid: params.cid,
    filename: params.filename,
    size: params.size,
    status: "DEAL_CREATING",
    createdAt: now(),
    updatedAt: now(),
    timeline: [{ at: now(), status: "DEAL_CREATING" }],
  };

  mockStore.deals.set(dealId, d);

  setTimeout(() => {
    const dd = mockStore.deals.get(dealId);
    if (!dd || dd.status === "FAILED") return;
    pushStatus(dd, "PENDING");
  }, 800);

  setTimeout(() => {
    const dd = mockStore.deals.get(dealId);
    if (!dd || dd.status === "FAILED") return;
    pushStatus(dd, "SEALING");
  }, 2500);

  setTimeout(() => {
    const dd = mockStore.deals.get(dealId);
    if (!dd || dd.status === "FAILED") return;
    pushStatus(dd, "ACTIVE");
  }, 5500);

  return { dealId };
}

export function getDealStatus(dealId: string) {
  // 1) 先查内存
  const inMem = mockStore.deals.get(dealId);
  if (inMem) return inMem;

  // 2) 内存没有 → 查落盘索引，回填一个最小可用记录
  const cid = findCidByDealId(dealId);
  if (!cid) throw new Error("dealId not found");

  const t = now();
  const reconstructed: DealRecord = {
    dealId,
    cid,
    status: "ACTIVE", // 重启后无法复现中间过程，直接视为已完成（mock）
    createdAt: t,
    updatedAt: t,
    timeline: [
      { at: t, status: "DEAL_CREATING" },
      { at: t, status: "PENDING" },
      { at: t, status: "SEALING" },
      { at: t, status: "ACTIVE" },
    ],
  };

  mockStore.deals.set(dealId, reconstructed);
  return reconstructed;
}

export function listDeals() {
  // 1) 内存里有就优先用（更完整）
  const mem = Array.from(mockStore.deals.values());
  if (mem.length > 0) {
    return mem.sort((a, b) => b.createdAt - a.createdAt);
  }

  // 2) 内存为空（重启后）→ 用落盘绑定构造最小列表
  const bindings = listDealBindings();
  const t = now();

  return bindings.map((b) => {
    const at = b.at || t;
    const reconstructed: DealRecord = {
      dealId: b.dealId,
      cid: b.cid,
      status: "ACTIVE",
      createdAt: at,
      updatedAt: at,
      timeline: [
        { at, status: "DEAL_CREATING" },
        { at, status: "PENDING" },
        { at, status: "SEALING" },
        { at, status: "ACTIVE" },
      ],
    };
    return reconstructed;
  });
}
