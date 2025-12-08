// src/services/upload.service.ts
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { UPLOAD_TMP_DIR, UPLOAD_MERGED_DIR } from "../config";

export interface InitUploadParams {
  fileName: string;
  fileSize: number;
  mimeType?: string;
  totalChunks: number;
  replicationStrategy?: "random" | "manual";
  selectedNodes?: string[];
}

export interface InitUploadResult {
  uploadId: string;
}

export async function initUpload(
  params: InitUploadParams
): Promise<InitUploadResult> {
  if (!fs.existsSync(UPLOAD_TMP_DIR)) {
    fs.mkdirSync(UPLOAD_TMP_DIR, { recursive: true });
  }
  if (!fs.existsSync(UPLOAD_MERGED_DIR)) {
    fs.mkdirSync(UPLOAD_MERGED_DIR, { recursive: true });
  }

  const uploadId = randomUUID();
  const uploadDir = path.join(UPLOAD_TMP_DIR, uploadId);
  fs.mkdirSync(uploadDir, { recursive: true });

  const meta = {
    uploadId,
    ...params,
    createdAt: new Date().toISOString(),
  };

  fs.writeFileSync(
    path.join(uploadDir, "meta.json"),
    JSON.stringify(meta, null, 2)
  );

  return { uploadId };
}

export async function saveChunk(
  uploadId: string,
  index: number,
  buffer: Buffer
): Promise<void> {
  const uploadDir = path.join(UPLOAD_TMP_DIR, uploadId);
  if (!fs.existsSync(uploadDir)) {
    throw new Error("Upload session not found");
  }
  const chunkPath = path.join(uploadDir, `${index}.part`);
  await fs.promises.writeFile(chunkPath, buffer);
}

export async function assembleChunks(uploadId: string): Promise<{
  mergedFilePath: string;
  fileName: string;
  fileSize: number;
}> {
  const uploadDir = path.join(UPLOAD_TMP_DIR, uploadId);
  const metaPath = path.join(uploadDir, "meta.json");

  if (!fs.existsSync(metaPath)) {
    throw new Error("Upload metadata not found");
  }

  const metaRaw = fs.readFileSync(metaPath, "utf-8");
  const meta = JSON.parse(metaRaw) as {
    fileName: string;
    totalChunks: number;
  };

  const { fileName, totalChunks } = meta;

  const mergedFilePath = path.join(UPLOAD_MERGED_DIR, `${uploadId}-${fileName}`);
  const writeStream = fs.createWriteStream(mergedFilePath);

  for (let i = 0; i < totalChunks; i++) {
    const chunkPath = path.join(uploadDir, `${i}.part`);
    if (!fs.existsSync(chunkPath)) {
      writeStream.close();
      throw new Error(`Missing chunk index ${i}`);
    }
    const data = fs.readFileSync(chunkPath);
    writeStream.write(data);
  }

  writeStream.end();

  await new Promise<void>((resolve, reject) => {
    writeStream.on("finish", () => resolve());
    writeStream.on("error", (err) => reject(err));
  });

  const stat = fs.statSync(mergedFilePath);

  // 清理临时分片
  try {
    const files = fs.readdirSync(uploadDir);
    for (const f of files) {
      fs.unlinkSync(path.join(uploadDir, f));
    }
    fs.rmdirSync(uploadDir);
  } catch (e) {
    console.warn("cleanup upload dir error:", e);
  }

  return {
    mergedFilePath,
    fileName,
    fileSize: stat.size,
  };
}
