// src/api/mk20.ts
import axios, { AxiosInstance, AxiosError } from "axios";
import fs from "fs";
import FormData from "form-data";

/**
 * MK20 基础配置
 * 从 .env 读取 MK20_BASE_URL / MK20_API_KEY
 *
 * .env 示例：
 *   MK20_BASE_URL=https://your-curio-or-mk20-url
 *   MK20_API_KEY=xxxxx   # 目前 Curio 还没给就先留空
 */
const MK20_BASE_URL = process.env.MK20_BASE_URL || process.env.MK20_BASE_URL?.trim();
const MK20_API_KEY = process.env.MK20_API_KEY || "";

// 简单的启动时提示，避免忘记配置环境变量
if (!MK20_BASE_URL) {
  console.warn(
    "[mk20] MK20_BASE_URL is not set. Please configure it in your .env file to enable real MK20 deals."
  );
}

/**
 * 创建 axios 客户端
 */
const mk20Client: AxiosInstance = axios.create({
  baseURL: MK20_BASE_URL || undefined,
  timeout: 30_000,
});

// 每个请求自动带上 Authorization（如果配置了的话）
mk20Client.interceptors.request.use((config) => {
  const headers = (config.headers || {}) as any;

  if (MK20_API_KEY) {
    headers["Authorization"] = `Bearer ${MK20_API_KEY}`;
  }

  // 保底 Content-Type：JSON
  headers["Content-Type"] = headers["Content-Type"] || "application/json";

  config.headers = headers;
  return config;
});

/**
 * 公共错误封装，方便 controller 统一处理
 */
export class Mk20Error extends Error {
  public cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "Mk20Error";
    this.cause = cause;
  }
}

function ensureConfigured() {
  if (!MK20_BASE_URL) {
    throw new Mk20Error(
      "[mk20] MK20_BASE_URL is not configured. Please set it in your .env file (MK20_BASE_URL, MK20_API_KEY)."
    );
  }
}

/**
 * ====== 1. Market 元数据相关（之前已经用到） ======
 */

export interface MarketMeta {
  contracts: string[];
  products: string[];
  sources: string[];
}

async function safeGet<T>(path: string): Promise<T> {
  try {
    ensureConfigured();
    const res = await mk20Client.get<T>(path);
    return res.data;
  } catch (err) {
    const e = err as AxiosError;
    throw new Mk20Error(
      `[mk20] GET ${path} failed: ${e.message}`,
      e.response?.data || e
    );
  }
}

export async function fetchSupportedContracts(): Promise<string[]> {
  const data = await safeGet<{ contracts: string[] }>("/market/contracts");
  return data.contracts || [];
}

export async function fetchSupportedProducts(): Promise<string[]> {
  const data = await safeGet<{ products: string[] }>("/market/products");
  return data.products || [];
}

export async function fetchSupportedSources(): Promise<string[]> {
  const data = await safeGet<{ sources: string[] }>("/market/sources");
  return data.sources || [];
}

/**
 * ====== 2. 真实上传：针对单个 uploadId 创建 MK20 Deal ======
 *
 * 这里按照我们约定的 mk20 接口形状：
 *   POST  /store   -> 创建存储任务 / 返回 storeId
 *   POST  /upload  -> 携带 storeId + 文件内容，真正上传数据
 *   （未来如果官方协议不同，只需要在这里调整即可）
 */

export interface Mk20DealRequest {
  uploadId: string;
  storedPath: string;
  storedFilename: string;
  sizeBytes: number;
  mimeType?: string;
  sha256?: string;
  durationDays: number;
  replicas: number;
  minerIds?: string[];
}

export interface Mk20DealResult {
  storeId: string;
  // 这里留好扩展位，等未来有正式字段可以直接塞进来
  rawStoreResponse: any;
  rawUploadResponse: any;
}

/**
 * 针对某个本地已上传文件，执行：
 *   1) 调用 /store 写入元数据
 *   2) 调用 /upload 上传真实文件
 */
export async function createMk20DealForUpload(
  payload: Mk20DealRequest
): Promise<Mk20DealResult> {
  ensureConfigured();

  const {
    uploadId,
    storedPath,
    storedFilename,
    sizeBytes,
    mimeType,
    sha256,
    durationDays,
    replicas,
    minerIds,
  } = payload;

  // 1) /store：写入元数据
  let storeId: string;

  try {
    const res = await mk20Client.post("/store", {
      label: `vaultx-${uploadId}`,
      sizeBytes,
      durationDays,
      replicas,
      minerIds,
      mimeType,
      sha256,
    });

    const data: any = res.data || {};
    storeId = data.storeId;

    if (!storeId) {
      throw new Mk20Error(
        "[mk20] /store response missing storeId, please check MK20 API spec."
      );
    }

    // 2) /upload：上传真实文件（使用 multipart/form-data）
    const form = new FormData();
    form.append("storeId", storeId);
    form.append("file", fs.createReadStream(storedPath), {
      filename: storedFilename,
      contentType: mimeType || "application/octet-stream",
    });

    const uploadRes = await mk20Client.post("/upload", form, {
      // form-data 自己会带上 boundary
      headers: form.getHeaders(),
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    return {
      storeId,
      rawStoreResponse: data,
      rawUploadResponse: uploadRes.data,
    };
  } catch (err) {
    const e = err as AxiosError;
    throw new Mk20Error(
      `[mk20] createMk20DealForUpload failed: ${e.message}`,
      e.response?.data || e
    );
  }
}

/**
 * ====== 3. 给 /api/config/curio 用的检测函数 ======
 */

export interface CurioConfigSummary {
  mk20BaseUrl: string | null;
  hasMk20ApiKey: boolean;
  note: string;
}

export function getCurioConfigSummary(): CurioConfigSummary {
  return {
    mk20BaseUrl: MK20_BASE_URL || null,
    hasMk20ApiKey: !!MK20_API_KEY,
    note:
      "Configure MK20_BASE_URL and MK20_API_KEY in your .env file to connect Curio / MK20.",
  };
}
