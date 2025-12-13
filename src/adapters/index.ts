// src/adapters/index.ts
import { getAdapterKindFromEnv } from "./storageProvider";
import { MockStorageProviderAdapter } from "./mockAdapter";
import type { StorageProviderAdapter } from "./storageProvider";

let singleton: StorageProviderAdapter | null = null;

export function getStorageProviderAdapter(): StorageProviderAdapter {
  if (singleton) return singleton;

  const kind = getAdapterKindFromEnv();
  switch (kind) {
    case "mock":
    default:
      singleton = new MockStorageProviderAdapter();
      return singleton;
  }
}
