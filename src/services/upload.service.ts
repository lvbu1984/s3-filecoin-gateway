// src/services/upload.service.ts

export type UploadStatus = "stored" | "failed";

export interface UploadRecord {
  uploadId: string;
  filename: string;
  storedFilename: string;
  sizeBytes: number;
  mimeType: string;
  sha256: string;
  storedPath: string;
  status: UploadStatus;
  note?: string;
  createdAt: string; // ISO 时间
}

// 简单内存数据库：进程重启后会丢失，够我们开发和调试用
const uploads: UploadRecord[] = [];

export function addUpload(record: UploadRecord) {
  uploads.push(record);
}

export function listUploads(): UploadRecord[] {
  // 可以根据时间倒序返回，方便查看
  return [...uploads].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getUploadById(uploadId: string): UploadRecord | undefined {
  return uploads.find((u) => u.uploadId === uploadId);
}
