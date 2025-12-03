// src/controllers/storage.controller.ts
import { Request, Response } from "express";
import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import os from "os";
import { v4 as uuidv4 } from "uuid";
import {
  mk20CreateStore,
  mk20UploadFile,
} from "../api/mk20";

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
 * 合并所有分片 + 尝试推送到 MK20
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
    const localUploadId = uuidv4();

    console.log(
      `[upload/complete] merged`,
      fileName,
      "size =",
      stat.size,
      "bytes, localUploadId =",
      localUploadId
    );

    // ========= 这里开始：尝试推送到 MK20 =========
    let finalUploadId = localUploadId;
    let cid: string | undefined;
    let mk20Status: string | undefined;
    let note = "已在本地合并文件";

    try {
      if (process.env.MK20_BASE_URL) {
        console.log("[upload/complete] pushing to MK20...");
        const store = await mk20CreateStore({
          filename: fileName,
          sizeBytes: stat.size,
        });

        finalUploadId = store.storeId || localUploadId;

        const uploadResult = await mk20UploadFile(finalUploadId, mergedPath);

        cid = uploadResult.cid;
        mk20Status = uploadResult.status ?? "pending";
        note = "已上传到 MK20，等待后续处理";

        console.log(
          "[upload/complete] MK20 done storeId =",
          finalUploadId,
          "cid =",
          cid,
          "status =",
          mk20Status
        );
      } else {
        console.warn(
          "[upload/complete] MK20_BASE_URL not set, skip MK20 upload (local only)"
        );
        note = "MK20 未配置，目前仅在本地合并文件";
      }
    } catch (mkErr: any) {
      console.error("[upload/complete] MK20 upload failed:", mkErr?.message);
      note =
        "MK20 上传失败，仅保留本地合并文件：" +
        (mkErr?.message || "unknown error");
    }

    // ========= 最终返回给前端 =========
    return res.json({
      ok: true,
      uploadId: finalUploadId, // 前端仍然用 uploadId 字段，不需要改
      filename: fileName,
      sizeBytes: stat.size,
      storeID: finalUploadId, // 兼容以前的字段名
      cid,
      status: mk20Status,
      note,
    });
  } catch (err: any) {
    console.error("[upload/complete] error", err);
    return res
      .status(500)
      .json({ ok: false, message: err?.message || "internal error" });
  }
}

