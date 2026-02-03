Phase 1 · S3 Ingress 行为规范（冻结）

文档状态：Frozen
适用范围：SFG Phase 1
目的：定义 SFG 在 Phase 1 中对 S3 客户端 的全部可观察行为
原则：未明确写入本文档的行为，一律视为“不支持 / 未定义”

1. 总体定位（Normative）

S3 Ingress 是 SFG 的 协议入口层（Protocol Ingress Layer），其职责仅限于：

接收并解析 S3 风格 HTTP 请求

校验请求的协议合法性

将“已验证的请求事实”传递给 Core Translator

在 Phase 1 中，不得返回任何“成功写入”的假象

S3 Ingress 不负责：

数据落盘

数据 staging

与 MK20 的任何交互

业务成功/失败的最终判定

2. 网络与监听行为
2.1 监听地址

默认监听地址：:8080

可通过环境变量覆盖：

SFG_LISTEN=:PORT

2.2 健康检查接口
项目	行为
Method	GET
Path	/ 或 /health
Response	200 OK
Body	ok\n

该接口不属于 S3 协议的一部分，仅用于运维与可达性验证。

3. 支持的请求模型（Phase 1）
3.1 请求路径（Path-style only）

Phase 1 仅支持 Path-style S3 请求：

/{bucket}/{object-key}


示例：

PUT /my-bucket/path/to/file.txt

不支持的形式（明确拒绝）：

Virtual-hosted-style

my-bucket.s3.amazonaws.com/...


缺失 bucket 或 object-key

/bucket/（object-key 为空）

错误响应：
条件	HTTP Status
路径非法	400 Bad Request
4. 支持的 HTTP Method
4.1 PUT Object（唯一支持）
项目	行为
Method	PUT
语义	尝试写入一个对象
实际结果	Phase 1 不执行写入
4.2 其他 Method
Method	行为
GET	❌ 不支持
HEAD	❌ 不支持
DELETE	❌ 不支持
LIST	❌ 不支持
错误响应：
Method	HTTP Status
非 PUT	405 Method Not Allowed
5. Header 语义与校验（Phase 1）
5.1 Content-Length（强制）

必须提供

必须是：

十进制整数

非负

错误处理：
条件	HTTP Status
缺失 Content-Length	411 Length Required
非法值	400 Bad Request
负数	400 Bad Request
5.2 Content-Type

可选

Phase 1 不做语义解释

仅作为请求事实保留

5.3 Expect: 100-continue

Phase 1 仅识别 header

不会主动返回 100 Continue

若请求最终被拒绝（Phase 1 固定拒绝），客户端不应发送 body

6. Request Body 行为（关键冻结点）
Phase 1 明确约束：

S3 Ingress 在 Phase 1 中，绝不会读取 request body。

原因：

Stage / Commit 尚未实现

读取 body 会造成：

资源浪费

假成功语义

不可回滚行为

7. Phase 1 的最终响应语义（最重要）
7.1 所有合法 PUT 请求的最终结果
项目	行为
HTTP Status	501 Not Implemented
含义	系统明确拒绝执行写入
目的	防止任何“成功写入”的误判
返回体示例：
not implemented: Phase 1 only freezes architecture and S3 ingress

7.2 为什么不是 200 / 204？

Phase 1：

没有 staging

没有 commit

没有 MK20

返回成功码会：

误导客户端

破坏 S3 语义可信性

👉 宁可全部失败，也不允许假成功

8. 错误处理的一般原则

使用最直接的 HTTP status

不返回 XML（Phase 1 简化）

不模仿 AWS S3 的复杂错误结构

错误信息 以工程可读性优先

9. 冻结声明（Freeze Declaration）

以下行为在 Phase 1 中视为 冻结，不得更改：

仅支持 Path-style

仅支持 PUT

强制 Content-Length

不读取 request body

所有 PUT 返回 501

任何变更必须：

明确标注 Phase 升级

通过新文档冻结

不得 retroactively 修改 Phase 1 行为

10. Phase 2 预告（非规范）

Phase 2 将在保持本规范不变的前提下，引入：

Stage（body streaming）

Core Translator 输出模型

MK20 Commit
