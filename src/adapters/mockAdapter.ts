// src/adapters/mockAdapter.ts
import type {
  StorageProviderAdapter,
  UploadInitInput,
  UploadChunkInput,
  UploadCompleteInput,
  CreateDealInput,
} from "./storageProvider";

import {
  initUpload,
  saveChunk,
  completeUpload,
  getUploadStatus as getMockUploadStatus,
} from "../services/mockUpload.service";

import { createMockDeal, getDealStatus, listDeals } from "../services/mockDeal.service";
import { findCompletedUploadByCid, listCompletedUploads } from "../services/mockUploadIndex";
import { appendDealBinding, findDealIdByCid } from "../services/mockDealIndex";

export class MockStorageProviderAdapter implements StorageProviderAdapter {
  async initUpload(input: UploadInitInput) {
    return initUpload(input);
  }

  async uploadChunk(input: UploadChunkInput) {
    return saveChunk(input);
  }

  async completeUpload(input: UploadCompleteInput) {
    return completeUpload(input);
  }

  async getUploadStatus(uploadId: string) {
    return getMockUploadStatus(uploadId);
  }

  async listUploads() {
    const items = listCompletedUploads().map((u) => {
      const dealId = findDealIdByCid(u.cid); // 若存在则回填
      return dealId ? { ...u, dealId } : u;
    });
    return { items };
  }

  async createDeal(input: CreateDealInput) {
    const cid = String(input.cid);

    // ✅ 落盘幂等（重启仍成立）
    const persisted = findDealIdByCid(cid);
    if (persisted) return { dealId: persisted, idempotent: true, persisted: true };

    // ✅ 冻结边界：cid 必须来自 COMPLETED upload（内存或落盘）
    const upload = findCompletedUploadByCid(cid);
    if (!upload) {
      const err: any = new Error("cid is not from a COMPLETED upload (upload→deal boundary enforced)");
      err.statusCode = 400;
      throw err;
    }

    // ✅ 内存幂等（同一 upload/cid 只创建一次）
    const existing = (upload as any).dealId as string | undefined;
    if (existing) {
      appendDealBinding({ cid, dealId: existing });
      return { dealId: existing, idempotent: true };
    }

    // ✅ 创建 deal：以 upload 元数据为准
    const data = createMockDeal({ cid, filename: upload.filename, size: upload.totalSize });
    (upload as any).dealId = data.dealId;
    appendDealBinding({ cid, dealId: data.dealId });

    return data;
  }

  async getDealStatus(dealId: string) {
    return getDealStatus(dealId);
  }

  async listDeals() {
    return { items: listDeals() };
  }
}
