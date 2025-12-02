// src/controllers/storage.controller.ts
import { Request, Response } from "express";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import {
  createMk20DealForUpload,
  Mk20DealRequest,
  Mk20Error,
  getCurioConfigSummary,
} from "../api/mk20";

/**
 * 上传记录类型
 */
export type UploadStatus =
  | "stored" // 只存本地，还没走 MK20
  | "deal_pending" // 正在为它创建 MK20 deal
  | "deal_created" // 已创建成功
  | "deal_failed"; // 创建失败

export interface UploadRecord {
  uploadId: string;
  filename: string;
  storedFilename: string;
  storedPath: string;
  mimeType: string;
  sizeBytes: number;
  sha256: string;
  status: UploadStatus;
  note?: string;
  createdAt: string;

  mk20?: {
    storeId?: string;
    error?: string;
    rawStoreResponse?: any;
    rawUploadResponse?: any;
  };
}

/**
 * In-memory 存储（后面可以换成数据库）
 */
const uploadRecords: Map<string, UploadRecord> = new Map();

/**
 * 计算文件 SHA-256
 */
function calcSha256(filePath: string): string {
  const hash = crypto.createHash("sha256");
  const data = fs.readFileSync(filePath);
  hash.update(data);
  return hash.digest("hex");
}

/**
 * ===== 1. Demo Quote（之前已经实现） =====
 */

export async function getStorageQuote(req: Request, res: Response) {
  try {
    const { sizeBytes, durationDays, replicas, strategy } = req.body || {};

    const parsedSize = Number(sizeBytes) || 0;
    const parsedDuration = Number(durationDays) || 180;
    const parsedReplicas = Number(replicas) || 1;

    // 简单的 demo 价格逻辑：每 TiB 每 180 天 0.066 FIL
    const sizeTiB = parsedSize / (1024 ** 4);
    const baseRatePerTiBPer180Days = 0.066;

    const totalFil =
      sizeTiB * (parsedDuration / 180) * parsedReplicas * baseRatePerTiBPer180Days;

    const miners = [
      {
        minerId: "f03080038",
        label: "Node f03080038 · Hangzhou IDC",
        reliability: 0.998,
        baseRateFil: 0.066,
        storagePriceFil: 0.06,
        retrievalPriceFil: 0.006,
        totalFil: Number((totalFil / 2).toFixed(6)),
      },
      {
        minerId: "f0491919",
        label: "Node f0491919 · Shanghai DC",
        reliability: 0.996,
        baseRateFil: 0.066,
        storagePriceFil: 0.06,
        retrievalPriceFil: 0.006,
        totalFil: Number((totalFil / 2).toFixed(6)),
      },
    ];

    return res.json({
      request: {
        sizeBytes: parsedSize,
        durationDays: parsedDuration,
        replicas: parsedReplicas,
        strategy: strategy || "random",
      },
      miners,
      currency: "FIL",
      isDemoPrice: true,
      totalFil: Number(totalFil.toFixed(6)),
      note:
        "This is a demo quote calculated locally. Real prices will be fetched from Curio / MK20 later.",
    });
  } catch (err) {
    console.error("[storage] getStorageQuote error", err);
    return res.status(500).json({
      error: "Internal server error",
      message: "Failed to calculate quote.",
    });
  }
}

/**
 * ===== 2. 上传文件到 VaultX API 本地磁盘 =====
 * 路由：POST /api/storage/upload
 * 中间件：multer 已在 routes 里配置
 */
export function handleFileUpload(req: Request, res: Response) {
  try {
    const file = (req as any).file as Express.Multer.File | undefined;

    if (!file) {
      return res.status(400).json({ error: "No file provided." });
    }

    const uploadId = file.filename.split(".")[0]; // filename 用 uuidv4()
    const storedPath = file.path;
    const sha256 = calcSha256(storedPath);

    const record: UploadRecord = {
      uploadId,
      filename: file.originalname,
      storedFilename: path.basename(storedPath),
      storedPath,
      mimeType: file.mimetype || "application/octet-stream",
      sizeBytes: file.size,
      sha256,
      status: "stored",
      note:
        "Demo upload: file is stored locally on VaultX API server. MK20 deal creation will be wired here later.",
      createdAt: new Date().toISOString(),
    };

    uploadRecords.set(uploadId, record);

    return res.json(record);
  } catch (err) {
    console.error("[storage] handleFileUpload error", err);
    return res.status(500).json({
      error: "Internal server error",
      message: "Failed to handle upload.",
    });
  }
}

/**
 * ===== 3. 查询单个上传记录 =====
 * GET /api/storage/upload/:uploadId
 */
export function getUploadById(req: Request, res: Response) {
  const { uploadId } = req.params;

  const record = uploadRecords.get(uploadId);
  if (!record) {
    return res.status(404).json({
      error: "Not found",
      uploadId,
    });
  }

  return res.json(record);
}

/**
 * ===== 4. 列出所有上传记录 =====
 * GET /api/storage/uploads
 */
export function listUploads(req: Request, res: Response) {
  const uploads = Array.from(uploadRecords.values());
  return res.json({ uploads });
}

/**
 * ===== 5. 查询 Curio / MK20 配置情况 =====
 * GET /api/config/curio
 */
export function getCurioConfig(req: Request, res: Response) {
  const summary = getCurioConfigSummary();
  return res.json(summary);
}

/**
 * ===== 6. 为某个 uploadId 创建真实 MK20 Deal =====
 *
 * 路由：POST /api/storage/upload/:uploadId/deal
 * 请求体（暂定）：
 *   {
 *     "durationDays": 180,
 *     "replicas": 2,
 *     "minerIds": ["f03080038", "f0491919"]
 *   }
 */
export async function createDealForUpload(req: Request, res: Response) {
  const { uploadId } = req.params;
  const { durationDays, replicas, minerIds } = req.body || {};

  const record = uploadRecords.get(uploadId);
  if (!record) {
    return res.status(404).json({
      error: "Not found",
      uploadId,
    });
  }

  // 如果已经创建过，就直接返回
  if (record.status === "deal_created" && record.mk20?.storeId) {
    return res.json({
      message: "Deal already created for this upload.",
      upload: record,
    });
  }

  // 构造 MK20 请求参数
  const payload: Mk20DealRequest = {
    uploadId: record.uploadId,
    storedPath: record.storedPath,
    storedFilename: record.storedFilename,
    sizeBytes: record.sizeBytes,
    mimeType: record.mimeType,
    sha256: record.sha256,
    durationDays: Number(durationDays) || 180,
    replicas: Number(replicas) || 1,
    minerIds: Array.isArray(minerIds) ? minerIds : undefined,
  };

  record.status = "deal_pending";
  record.note = "Creating MK20 deal…";
  uploadRecords.set(uploadId, record);

  try {
    const result = await createMk20DealForUpload(payload);

    record.status = "deal_created";
    record.note = "MK20 deal created successfully.";
    record.mk20 = {
      storeId: result.storeId,
      rawStoreResponse: result.rawStoreResponse,
      rawUploadResponse: result.rawUploadResponse,
      error: undefined,
    };
    uploadRecords.set(uploadId, record);

    return res.json({
      message: "MK20 deal created successfully.",
      upload: record,
    });
  } catch (err) {
    console.error("[storage] createDealForUpload error", err);

    const message =
      err instanceof Mk20Error ? err.message : "Unexpected error creating MK20 deal";

    record.status = "deal_failed";
    record.note = message;
    record.mk20 = {
      ...(record.mk20 || {}),
      error: message,
    };
    uploadRecords.set(uploadId, record);

    return res.status(500).json({
      error: "MK20 deal creation failed",
      message,
    });
  }
}
