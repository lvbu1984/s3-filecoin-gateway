export type DealStatus =
    | "INIT"
    | "UPLOADING"
    | "UPLOADED"
    | "DEAL_CREATING"
    | "PENDING"
    | "SEALING"
    | "ACTIVE"
    | "FAILED";

export type UploadStatus = "INIT" | "UPLOADING" | "COMPLETED" | "FAILED";

export type UploadSession = {
    dealId?: string; // 绑定的 deal（用于幂等：一个 upload/cid 只能创建一次）
    uploadId: string;
    filename: string;
    totalSize: number;
    chunkSize: number;
    totalChunks: number;
    receivedChunks: Set<number>;
    status: UploadStatus;
    createdAt: number;
    updatedAt: number;
    // 本地存储路径
    dir: string;
    cid?: string; // complete 后生成
};

export type DealRecord = {
    dealId: string;
    cid: string;
    filename?: string;
    size?: number;
    status: DealStatus;
    createdAt: number;
    updatedAt: number;
    // mock: 用于状态机推进
    timeline?: { at: number; status: DealStatus }[];
    error?: string;
};
