// src/vaultx.ts
import axios, { AxiosInstance } from "axios";

const MK20_BASE_URL = process.env.MK20_BASE_URL;
const MK20_API_KEY = process.env.MK20_API_KEY || "";

if (!MK20_BASE_URL) {
  // 用明确的错误，方便你在启动时就发现 .env 没配好
  // 生产环境可以改成 warning
  console.warn(
    "[VaultX] MK20_BASE_URL is not set. Market 2.0 API calls will fail until it is configured."
  );
}

let client: AxiosInstance | null = null;

function getClient(): AxiosInstance {
  if (!client) {
    client = axios.create({
      baseURL: MK20_BASE_URL,
      timeout: 30_000,
      headers: MK20_API_KEY
        ? {
            Authorization: `Bearer ${MK20_API_KEY}`,
          }
        : undefined,
    });
  }
  return client;
}

// ---- 类型定义 ----
export interface SupportedContracts {
  contracts: string[];
}

export interface SupportedProducts {
  products: string[];
}

export interface SupportedDataSources {
  sources: string[];
}

// ---- 对应 Market 2.0 /contracts /products /sources ----
export async function fetchSupportedContracts(): Promise<SupportedContracts> {
  const c = getClient();
  const res = await c.get<SupportedContracts>("/contracts");
  return res.data;
}

export async function fetchSupportedProducts(): Promise<SupportedProducts> {
  const c = getClient();
  const res = await c.get<SupportedProducts>("/products");
  return res.data;
}

export async function fetchSupportedSources(): Promise<SupportedDataSources> {
  const c = getClient();
  const res = await c.get<SupportedDataSources>("/sources");
  return res.data;
}

// 预留给后续步骤（创建 deal / 上传 / 状态查询等）
// export async function createDeal(...) { ... }
// export async function startUpload(...) { ... }
// ...
