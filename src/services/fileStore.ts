// src/services/fileStore.ts
// 用一个本地 JSON 文件当简单数据库，记录已上传的文件信息

import fs from "fs";
import fsp from "fs/promises";
import path from "path";

export interface StoredFile {
  id: string;           // 我们用 uploadId/storeId 作为 id
  filename: string;
  sizeBytes: number;
  uploadId: string;     // 兼容字段
  cid?: string;
  status?: string;
  note?: string;
  localPath: string;    // 合并后的本地文件路径
  createdAt: string;
  updatedAt: string;
}

const DATA_FILE = path.join(process.cwd(), "files.json");

async function ensureDataFile() {
  try {
    await fsp.access(DATA_FILE);
  } catch {
    await fsp.writeFile(DATA_FILE, "[]", "utf-8");
  }
}

async function readAll(): Promise<StoredFile[]> {
  await ensureDataFile();
  const raw = await fsp.readFile(DATA_FILE, "utf-8");
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as StoredFile[];
    return [];
  } catch {
    return [];
  }
}

async function writeAll(list: StoredFile[]) {
  await fsp.writeFile(DATA_FILE, JSON.stringify(list, null, 2), "utf-8");
}

// 新增或更新一条记录（以 id 为主键）
export async function upsertFile(record: StoredFile) {
  const list = await readAll();
  const idx = list.findIndex((f) => f.id === record.id);
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...record, updatedAt: new Date().toISOString() };
  } else {
    const now = new Date().toISOString();
    list.push({
      ...record,
      createdAt: record.createdAt ?? now,
      updatedAt: now,
    });
  }
  await writeAll(list);
}

// 获取列表
export async function listFiles(): Promise<StoredFile[]> {
  const list = await readAll();
  // 按时间倒序
  return list.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

// 按 id 查一条
export async function getFileById(id: string): Promise<StoredFile | undefined> {
  const list = await readAll();
  return list.find((f) => f.id === id);
}

// 删除一条记录（和本地文件）
export async function deleteFileById(id: string): Promise<boolean> {
  const list = await readAll();
  const idx = list.findIndex((f) => f.id === id);
  if (idx < 0) return false;

  const [removed] = list.splice(idx, 1);
  await writeAll(list);

  // 尝试删除本地文件
  if (removed?.localPath) {
    try {
      await fsp.unlink(removed.localPath);
    } catch {
      // 忽略文件不存在等错误
    }
  }

  return true;
}
