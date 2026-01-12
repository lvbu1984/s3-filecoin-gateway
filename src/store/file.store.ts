// src/store/file.store.ts

export type FileStatus = "uploading" | "stored" | "failed";

export interface FileRecord {
  fileId: string;
  filename: string;
  size: number;
  status: FileStatus;
}

const files = new Map<string, FileRecord>();

/**
 * Create file (initial status = uploading)
 */
export function addFile(input: {
  fileId: string;
  filename: string;
  size: number;
}) {
  files.set(input.fileId, {
    fileId: input.fileId,
    filename: input.filename,
    size: input.size,
    status: "uploading",
  });
}

/**
 * Update file status with strict state machine
 */
export function updateFileStatus(fileId: string, next: FileStatus) {
  const file = files.get(fileId);
  if (!file) {
    throw new Error("file not found");
  }

  const prev = file.status;

  // ---- STATE MACHINE (FROZEN) ----
  if (prev === "uploading" && (next === "stored" || next === "failed")) {
    file.status = next;
    return;
  }

  // Any other transition is illegal
  throw new Error(`illegal status transition: ${prev} -> ${next}`);
}

/**
 * Read-only list for admin
 */
export function listFiles() {
  return Array.from(files.values());
}
