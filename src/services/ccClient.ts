// src/services/ccClient.ts

export interface CreateDealPayload {
  filePath: string;
  fileName: string;
  fileSize: number;

  // 预留字段，未来接 CC 文档时可以用
  clientAddress?: string;
  encrypted?: boolean;
  replicationStrategy?: "random" | "manual";
  selectedMiners?: string[];
  durationDays?: number;
  notes?: string;
}

export interface CreateDealResult {
  taskId?: string;
  dealId?: string;
  status: string;
  message?: string;
  raw?: any;
}

/**
 * 当前阶段：Stub 实现
 * - 不调用任何外部服务
 * - 返回一个模拟的任务结果
 * - 方便前后端联调与 UI 展示
 *
 * 等 CC 节点部署好后：
 * 👉 直接用“真实版 ccClient.ts”覆盖本文件即可。
 */
export async function createDealOnCC(
  payload: CreateDealPayload
): Promise<CreateDealResult> {
  console.log("[Stub CC] createDealOnCC called with:", payload);

  // 模拟一点异步延迟
  await new Promise((resolve) => setTimeout(resolve, 500));

  const fakeTaskId = `mock-task-${Date.now()}`;
  const fakeDealId = `mock-deal-${Math.random().toString(36).slice(2, 10)}`;

  return {
    taskId: fakeTaskId,
    dealId: fakeDealId,
    status: "submitted",
    message: "Stubbed CC deal. Replace with real CC API later.",
    raw: {
      stub: true,
    },
  };
}
