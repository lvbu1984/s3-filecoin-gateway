// src/controllers/internal.controller.ts
/**
 * Internal Controllers
 *
 * These controllers are the ONLY layer
 * allowed to write to internal stores.
 */

import { addFile } from "../store/file.store";
import {
  InternalAddFileRequest,
  InternalAddFileResponse,
} from "../internal/types";

/**
 * Add file via internal API
 */
export function addInternalFile(
  payload: InternalAddFileRequest
): InternalAddFileResponse {
  const { filename, size } = payload;

  const fileId = `file_${Date.now()}`;

  addFile({
    fileId,
    filename,
    size,
    status: "stored",
  });

  return {
    ok: true,
    fileId,
  };
}
