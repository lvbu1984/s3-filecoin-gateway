// src/fileStore.ts
import fs from "fs";
import { FILE_RECORD_PATH } from "./config";

export interface FileRecord {
  id: string; // uploadId
  filename: string;
  sizeBytes: number;
  cid?: string;
  status?: string;
  note?: string;
  createdAt: string;

  // 支付相关字段（可选）
  walletAddress?: string;
  priceFil?: number;
  priceUsdfc?: number;
  paymentTxHash?: string;
}

function readAllRecords(): FileRecord[] {
  try {
    if (!fs.existsSync(FILE_RECORD_PATH)) {
      return [];
    }
    const raw = fs.readFileSync(FILE_RECORD_PATH, "utf-8");
    const data = JSON.parse(raw);
    if (Array.isArray(data)) {
      return data;
    }
    return [];
  } catch (e) {
    console.warn("readAllRecords error:", e);
    return [];
  }
}

function writeAllRecords(records: FileRecord[]) {
  try {
    fs.writeFileSync(FILE_RECORD_PATH, JSON.stringify(records, null, 2));
  } catch (e) {
    console.error("writeAllRecords error:", e);
  }
}

export function addFileRecord(record: FileRecord) {
  const list = readAllRecords();
  list.unshift(record); // 新的插最前面
  writeAllRecords(list);
}

export function listFileRecords(): FileRecord[] {
  return readAllRecords();
}

export function getFileRecord(id: string): FileRecord | undefined {
  const list = readAllRecords();
  return list.find((r) => r.id === id);
}

export function deleteFileRecord(id: string): FileRecord | undefined {
  const list = readAllRecords();
  const idx = list.findIndex((r) => r.id === id);
  if (idx === -1) return undefined;
  const [removed] = list.splice(idx, 1);
  writeAllRecords(list);
  return removed;
}
