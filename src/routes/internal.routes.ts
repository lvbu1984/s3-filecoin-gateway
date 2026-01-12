// src/routes/internal.routes.ts
/**
 * ⚠️ INTERNAL API ROUTES (FROZEN)
 *
 * These routes are part of the INTERNAL PROTOCOL.
 * They are NOT for Admin UI or public clients.
 *
 * Any change must follow the protocol freeze rules
 * defined in src/internal/types.ts
 */

import { Router } from "express";

/* ---------- Internal Protocol Types ---------- */
import {
  InternalAddFileRequest,
  InternalAddFileResponse,
  InternalUpdateFileStatusRequest,
  InternalUpdateFileStatusResponse,
} from "../internal/types";

/* ---------- Controllers / Stores ---------- */
import { addInternalFile } from "../controllers/internal.controller";
import { updateFileStatus } from "../store/file.store";

const router = Router();

/**
 * POST /api/internal/file/add
 * Create file (initial status = uploading)
 */
router.post("/file/add", (req, res) => {
  const body = req.body as InternalAddFileRequest;
  const { filename, size } = body;

  if (!filename || typeof size !== "number") {
    return res.status(400).json({ error: "invalid payload" });
  }

  const fileId = `file_${Date.now()}`;

  addInternalFile({ fileId, filename, size });

  const response: InternalAddFileResponse = {
    ok: true,
    fileId,
  };

  res.json(response);
});

/**
 * POST /api/internal/file/status
 * Update file status (STRICT STATE MACHINE)
 */
router.post("/file/status", (req, res) => {
  const body = req.body as InternalUpdateFileStatusRequest;

  if (!body.fileId || typeof body.fileId !== "string") {
    return res.status(400).json({ error: "invalid fileId" });
  }

  try {
    updateFileStatus(body.fileId, body.status);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }

  const response: InternalUpdateFileStatusResponse = { ok: true };
  res.json(response);
});

export default router;
