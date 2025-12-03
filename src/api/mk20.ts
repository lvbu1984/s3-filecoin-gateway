// src/api/mk20.ts
import axios from "axios";
import fs from "fs";
import path from "path";

// 从 .env 里读取 MK20 配置
const baseURL = process.env.MK20_BASE_URL;
const apiKey = process.env.MK20_API_KEY;

if (!baseURL) {
  console.warn(
    "[mk20] MK20_BASE_URL is not set. MK20 upload will be skipped (fallback to local only)."
  );
}

export const mk20 = axios.create({
  baseURL: baseURL,
  headers: {
    // 如果你们不是用 Bearer，可以改成 'X-API-Key': apiKey 之类
    Authorization: apiKey ? `Bearer ${apiKey}` : "",
  },
  timeout: 60_000,
});

export interface Mk20StoreResponse {
  storeId: string;
  uploadUrl?: string;
  cid?: string;
}

export interface Mk20UploadResult {
  storeId: string;
  cid?: string;
  status?: string;
}

/**
 * 1) 向 MK20 声明“我要存一个文件”
 * NOTE: 这里的 body 需要根据你们实际的 MK20 文档调整
 */
export async function mk20CreateStore(params: {
  filename: string;
  sizeBytes: number;
  mimeType?: string;
}): Promise<Mk20StoreResponse> {
  if (!baseURL) {
    throw new Error("MK20_BASE_URL not configured");
  }

  const body = {
    name: params.filename,
    size: params.sizeBytes,
    mimeType: params.mimeType ?? "application/octet-stream",
    profile: process.env.MK20_PROFILE ?? "default",
  };

  const { data } = await mk20.post("/store", body);

  return {
    storeId: data.storeId || data.id,
    uploadUrl: data.uploadUrl,
    cid: data.cid,
  };
}

/**
 * 2) 把本地合并好的文件上传到 MK20
 * NOTE: 同样，根据你们实际接口调整 URL 和字段名
 */
export async function mk20UploadFile(storeId: string, filePath: string) {
  if (!baseURL) {
    throw new Error("MK20_BASE_URL not configured");
  }

  const stat = fs.statSync(filePath);
  const stream = fs.createReadStream(filePath);

  // 动态引 form-data
  const FormData = require("form-data");
  const form = new FormData();

  form.append("file", stream, {
    filename: path.basename(filePath),
    knownLength: stat.size,
  });
  form.append("storeId", storeId);

  const { data } = await mk20.post("/upload", form, {
    headers: form.getHeaders(),
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
  });

  const result: Mk20UploadResult = {
    storeId,
    cid: data.cid,
    status: data.status,
  };

  return result;
}

/**
 * 3) 可选：查询 MK20 store 状态
 */
export async function mk20GetStatus(storeId: string) {
  if (!baseURL) {
    throw new Error("MK20_BASE_URL not configured");
  }

  const { data } = await mk20.get(`/status/${storeId}`);
  return data;
}

