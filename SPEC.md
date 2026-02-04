# S3–Filecoin Gateway  
## 行为规范（SPEC v0.1 · 冻结版）

> **目标定位**  
> Gateway 是一个**对象存储系统**，  
> 对外提供 S3 语义，  
> 对内使用 FWSS / MK20 / Curio，  
> **所有用户语义由 Gateway 兜底**。

---

## 一、系统边界（必须先钉死）

### Gateway **负责**
- S3 语义（PUT / GET / LIST / HEAD / DELETE）
- 对象命名空间（bucket / object key）
- 对象状态机
- 幂等、失败恢复、可重试
- 用户可见一致性

### Gateway **不负责**
- Filecoin 封装 / 证明 / 节点调度
- 直接暴露 CID / deal / sector
- 保证底层性能
- 实时证明（PDP 不在实时路径）

> **一句铁律**：  
> 用户看到的一切行为，只由 Gateway 决定，  
> 底层异常只能作为“原因”，不能作为“借口”。

---

## 二、核心对象模型（必须统一）

### Object（对象）


### 每个对象必须具备的最小元数据
- object_id（内部）
- bucket
- key
- size
- etag
- state（见下）
- created_at / updated_at
- mk20_request_id（可为空）
- last_error（可为空）

---

## 三、对象状态机（核心中的核心）

### 状态定义（冻结）



### 状态语义说明

- **INIT**  
  对象逻辑创建，但尚未接收任何数据

- **UPLOADING**  
  数据正在通过 Gateway 接收（multipart / 单文件）

- **STAGING**  
  数据已完整接收并校验，通过 Gateway 校验  
  ⚠️ 但尚未提交给 MK20

- **COMMITTING**  
  已调用 MK20 /store，等待底层推进

- **AVAILABLE**  
  Gateway 承诺对象可被 GET

- **FAILED**  
  存储流程失败，需要人工或系统介入

- **DELETED**  
  逻辑删除，对用户不可见

> ❗**禁止跳跃状态**  
> ❗**每一次状态变更必须有原因记录**

---

## 四、S3 API 行为规范（冻结）

### 1️⃣ PUT Object

**语义**
- PUT 成功 ≠ Filecoin 完成封装
- PUT 成功 = Gateway 接管对象存储责任

**行为**
- 创建对象（或覆盖旧对象）
- 进入 `UPLOADING`
- 完成后进入 `STAGING`
- 异步推进至 `COMMITTING`

**返回**
- 200 OK
- 返回 etag

---

### 2️⃣ GET Object

**仅允许**
- `AVAILABLE`

**其他状态**
- INIT / UPLOADING / STAGING / COMMITTING → 404
- FAILED → 500
- DELETED → 404

> **GET 是 Gateway 最严肃的承诺**

---

### 3️⃣ HEAD Object

- 查询 Gateway 元数据
- **不触碰 MK20 / Curio**
- 行为与 GET 的可见性规则一致

---

### 4️⃣ LIST Objects

**默认策略（冻结）：延迟可见**

- 仅列出 `AVAILABLE`
- 排除：
  - UPLOADING
  - COMMITTING
  - FAILED
  - DELETED

> LIST ≠ 实时状态  
> LIST = Gateway 认可的对象集合

---

### 5️⃣ DELETE Object

**语义**
- 逻辑删除

**行为**
- 状态 → DELETED
- 不承诺物理删除
- 后台可做生命周期管理

---

## 五、Multipart Upload（强制要求）

### Gateway 必须实现完整 multipart 状态机



### 要求
- 每个 part 校验
- complete 原子性
- abort 可清理
- 重试幂等

> ❗ multipart 失败 = Gateway 失败  
> ❗ 不允许“半个对象”

---

## 六、幂等与失败处理（冻结原则）

### 幂等
- 同一 `(bucket, key)` 的重复 PUT
- 不产生幽灵对象
- 覆盖语义明确

### 失败
- 所有失败必须：
  - 可解释
  - 可重试
  - 可追踪

> **禁止 silent failure**

---

## 七、MK20 使用规范（严格限制）

Gateway **只允许**：
- `/upload`
- `/store`
- `/status`

禁止：
- 透传 MK20 给用户
- 让用户感知 MK20 状态细节

> MK20 是**实现细节**，不是产品接口

---

## 八、PDP 的位置（冻结）

- PDP **不在请求路径**
- PDP 用于：
  - 后台健康检查
  - SLA
  - 风险告警

---

## 九、非目标（明确不做）

- ❌ S3 全量兼容（ACL / IAM / Lifecycle v1）
- ❌ 实时链上状态反映
- ❌ 秒级低延迟保证

---

## 十、最终“工程宪法”（一句话）

> **Gateway 的正确性优先于性能，  
> 一致性优先于速度，  
> 语义优先于底层实现。**
