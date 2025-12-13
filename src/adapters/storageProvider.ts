// src/adapters/storageProvider.ts
export type UploadInitInput = {
  filename: string;
  totalSize: number;
  chunkSize: number;
};

export type UploadInitOutput = {
  uploadId: string;
  totalChunks: number;
};

export type UploadChunkInput = {
  uploadId: string;
  chunkIndex: number;
  buffer: Buffer;
};

export type UploadChunkOutput = {
  received: number;
  total: number;
};

export type UploadCompleteInput = {
  uploadId: string;
};

export type UploadCompleteOutput = {
  cid: string;
};

export type UploadStatusOutput = {
  uploadId: string;
  filename: string;
  status: string;
  receivedChunks: number;
  totalChunks: number;
  cid?: string;
  dealId?: string;
};

export type UploadListItem = {
  at: number;
  uploadId: string;
  cid: string;
  filename: string;
  totalSize: number;
  chunkSize: number;
  totalChunks: number;
  dealId?: string; // 若已创建 deal，则回填
};

export type UploadListOutput = {
  items: UploadListItem[];
};

export type CreateDealInput = {
  cid: string;
};

export type CreateDealOutput = {
  dealId: string;
  idempotent?: boolean;
  persisted?: boolean;
};

export type DealStatusOutput = any;

export interface StorageProviderAdapter {
  // Upload
  initUpload(input: UploadInitInput): Promise<UploadInitOutput>;
  uploadChunk(input: UploadChunkInput): Promise<UploadChunkOutput>;
  completeUpload(input: UploadCompleteInput): Promise<UploadCompleteOutput>;
  getUploadStatus(uploadId: string): Promise<UploadStatusOutput>;
  listUploads(): Promise<UploadListOutput>;

  // Deal
  createDeal(input: CreateDealInput): Promise<CreateDealOutput>;
  getDealStatus(dealId: string): Promise<DealStatusOutput>;
  listDeals(): Promise<any>;
}

// 为未来切换实现做准备
export type AdapterKind = "mock";
export function getAdapterKindFromEnv(): AdapterKind {
  const v = (process.env.VAULTX_ADAPTER || "mock").toLowerCase();
  return v === "mock" ? "mock" : "mock";
}
