// src/controllers/upload.controller.ts
import { Request, Response } from "express";
import {
  initUpload,
  saveChunk,
  assembleChunks,
} from "../services/upload.service";
import { createDealOnCC } from "../services/ccClient";
import { addFileRecord } from "../fileStore";

export async function initUploadHandler(req: Request, res: Response) {
  try {
    const {
      fileName,
      fileSize,
      mimeType,
      totalChunks,
      replicationStrategy,
      selectedNodes,
    } = req.body || {};

    if (!fileName || !fileSize || !totalChunks) {
      return res
        .status(400)
        .json({ error: "fileName, fileSize, totalChunks are required" });
    }

    const result = await initUpload({
      fileName,
      fileSize,
      mimeType,
      totalChunks,
      replicationStrategy,
      selectedNodes,
    });

    return res.json(result);
  } catch (err: any) {
    console.error("initUploadHandler error:", err);
    return res.status(500).json({ error: "Failed to init upload" });
  }
}

export async function uploadChunkHandler(req: Request, res: Response) {
  try {
    const { uploadId, index, total } = req.query as any;

    if (!uploadId || index === undefined) {
      return res.status(400).json({ error: "uploadId and index are required" });
    }
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: "chunk file is required" });
    }

    const chunkIndex = parseInt(index, 10);
    await saveChunk(uploadId, chunkIndex, req.file.buffer);

    return res.json({
      ok: true,
      uploadId,
      index: chunkIndex,
      total: total ? parseInt(total as string, 10) : undefined,
    });
  } catch (err: any) {
    console.error("uploadChunkHandler error:", err);
    return res.status(500).json({ error: "Failed to upload chunk" });
  }
}

export async function completeUploadHandler(req: Request, res: Response) {
  try {
    const {
      uploadId,
      walletAddress,
      priceFil,
      priceUsdfc,
      paymentTxHash,
    } = req.body || {};
    if (!uploadId) {
      return res.status(400).json({ error: "uploadId is required" });
    }

    const { mergedFilePath, fileName, fileSize } =
      await assembleChunks(uploadId);

    const ccResult = await createDealOnCC({
      filePath: mergedFilePath,
      fileName,
      fileSize,
      notes: "Uploaded via VaultX (stub CC)",
    });

    // 将支付信息一并记录
    addFileRecord({
      id: uploadId,
      filename: fileName,
      sizeBytes: fileSize,
      cid: undefined,
      status: ccResult.status,
      note:
        ccResult.message ||
        "Stubbed CC deal. Replace with real CC API later.",
      createdAt: new Date().toISOString(),

      walletAddress,
      priceFil,
      priceUsdfc,
      paymentTxHash,
    });

    return res.json({
      uploadId,
      fileName,
      fileSize,
      ccResult,
    });
  } catch (err: any) {
    console.error("completeUploadHandler error:", err);
    return res.status(500).json({ error: "Failed to complete upload" });
  }
}
