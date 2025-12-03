// src/controllers/storage.controller.ts
import { Request, Response } from "express";
import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import os from "os";
import { v4 as uuidv4 } from "uuid";

const BASE_TMP_DIR = path.join(os.tmpdir(), "vaultx_uploads");

async function ensureDir(dir: string) {
  await fsp.mkdir(dir, { recursive: true });
}

/**
 * 处理单个分片上传
 * 对应前端：POST http://localhost:4000/api/storage/upload/chunk
 */
export async function handleUploadChunk(req: Request, res: Response) {
  try {
    const file = req.file;
    const { index, fileName } = req.body as {
      index: string;
      fileName: string;
    };

    if (!file || index === undefined || !fileName) {
      return res
        .status(400)
        .json({ ok: false, message: "missing file / index / fileName" });
    }

    // 每个原始文件一个子目录
    const fileDir = path.join(BASE_TMP_DIR, fileName);
    await ensureDir(fileDir);

    const destPath = path.join(fileDir, `chunk_${index}`);
    await fsp.rename(file.path, destPath);

    console.log(
      `[upload/chunk]`,
      fileName,
      "chunk",
      index,
      "->",
      destPath
    );

    return res.json({ ok: true });
  } catch (err: any) {
    console.error("[upload/chunk] error", err);
    return res
      .status(500)
      .json({ ok: false, message: err?.message || "internal error" });
  }
}

/**
 * 合并所有分片
 * 对应前端：POST http://localhost:4000/api/storage/upload/complete
 */
export async function handleUploadComplete(req: Request, res: Response) {
  try {
    const { fileName, totalChunks } = req.body as {
      fileName: string;
      totalChunks: string | number;
    };

    if (!fileName || totalChunks === undefined) {
      return res
        .status(400)
        .json({ ok: false, message: "missing fileName / totalChunks" });
    }

    const chunksCount = Number(totalChunks);
    const fileDir = path.join(BASE_TMP_DIR, fileName);
    const mergedPath = path.join(fileDir, `${fileName}.merged`);

    await ensureDir(fileDir);

    console.log(
      `[upload/complete] start merge`,
      fileName,
      "chunks =",
      chunksCount
    );

    const writeStream = fs.createWriteStream(mergedPath);

    for (let i = 0; i < chunksCount; i++) {
      const chunkPath = path.join(fileDir, `chunk_${i}`);

      // 检查分片是否存在
      const exists = await fsp
        .access(chunkPath)
        .then(() => true)
        .catch(() => false);

      if (!exists) {
        writeStream.close();
        console.error("[upload/complete] missing chunk", i, chunkPath);
        return res
          .status(400)
          .json({ ok: false, message: `missing chunk ${i}` });
      }

      await new Promise<void>((resolve, reject) => {
        const rs = fs.createReadStream(chunkPath);
        rs.on("error", reject);
        rs.on("end", resolve);
        rs.pipe(writeStream, { end: false });
      });
    }

    writeStream.end();

    const stat = await fsp.stat(mergedPath);
    const uploadId = uuidv4();

    console.log(
      `[upload/complete] merged`,
      fileName,
      "size =",
      stat.size,
      "bytes, uploadId =",
      uploadId
    );

    return res.json({
      ok: true,
      uploadId,
      filename: fileName,
      sizeBytes: stat.size,
      storeID: uploadId, // 先用 uploadId 代替 storeID
    });
  } catch (err: any) {
    console.error("[upload/complete] error", err);
    return res
      .status(500)
      .json({ ok: false, message: err?.message || "internal error" });
  }
}
