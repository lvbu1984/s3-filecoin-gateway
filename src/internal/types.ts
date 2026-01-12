// src/internal/types.ts
/**
 * Internal API Protocol Definitions (FROZEN)
 *
 * ⚠️ These types define the ONLY allowed
 * request / response shapes for internal APIs.
 *
 * Any change here MUST be considered breaking.
 */

/* ---------------- File ---------------- */

/**
 * POST /api/internal/file/add
 */
/**
 * 🔒 PROTOCOL FREEZE RULES
 *
 * - These types are considered STABLE.
 * - Any change here is a BREAKING CHANGE.
 *
 * Change process:
 *   1. Create a new versioned type (e.g. InternalAddFileRequestV2)
 *   2. Keep old versions working
 *   3. Migrate callers explicitly
 *
 * ❌ Do NOT:
 *   - Rename fields
 *   - Change field meanings
 *   - Reuse fields for other purposes
 */

export interface InternalAddFileRequest {
  filename: string;
  size: number; // bytes
}

export interface InternalAddFileResponse {
  ok: true;
  fileId: string;
}

/**
 * POST /api/internal/file/updateStatus
 */
export interface InternalUpdateFileStatusRequest {
  fileId: string;
  status: "uploading" | "stored" | "failed";
}

export interface InternalUpdateFileStatusResponse {
  ok: true;
}
