// src/cli/internal-client.ts
/**
 * Internal API Client for CLI
 *
 * This client is the ONLY place where
 * CLI is allowed to talk to internal APIs.
 */

import {
  InternalAddFileRequest,
  InternalAddFileResponse,
} from "../internal/types";

const INTERNAL_API_BASE =
  process.env.VAULTX_INTERNAL_API || "http://127.0.0.1:4000/api/internal";

/**
 * Add file via internal API
 */
export async function addFile(
  payload: InternalAddFileRequest
): Promise<InternalAddFileResponse> {
  const res = await fetch(`${INTERNAL_API_BASE}/file/add`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`internal addFile failed: ${text}`);
  }

  return res.json();
}
