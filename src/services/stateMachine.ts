import type { UploadStatus } from "../models/types";

const UPLOAD_ALLOWED: Record<UploadStatus, UploadStatus[]> = {
  INIT: ["UPLOADING", "FAILED"],
  UPLOADING: ["UPLOADING", "COMPLETED", "FAILED"],
  COMPLETED: ["COMPLETED"], // 终态
  FAILED: ["FAILED"],       // 终态
};

export function assertUploadTransition(prev: UploadStatus, next: UploadStatus) {
  const allowed = UPLOAD_ALLOWED[prev] || [];
  if (!allowed.includes(next)) {
    throw new Error(`Illegal upload status transition: ${prev} -> ${next}`);
  }
}
