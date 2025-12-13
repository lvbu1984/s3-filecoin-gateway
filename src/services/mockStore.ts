import type { DealRecord, UploadSession } from "../models/types";

export const mockStore: {
  uploads: Map<string, UploadSession>;
  deals: Map<string, DealRecord>;
} = {
  uploads: new Map<string, UploadSession>(),
  deals: new Map<string, DealRecord>(),
};
