# 前后端接口契约

> 前端 Base URL 通过环境变量 `NEXT_PUBLIC_API_BASE` 配置。  
> 所有需要登录的接口，Header 中携带：`Authorization: Bearer <jwt_token>`

---

## 0. 统一响应结构

所有接口（SSE 流式接口除外）均使用统一的 `Result<T>` 信封：

```json
// 成功
{ "code": 0, "message": "ok", "data": <T> }

// 失败
{ "code": <http_status_code>, "message": "错误说明", "data": null }
```

| 字段      | 类型   | 说明                                    |
|-----------|--------|-----------------------------------------|
| `code`    | number | `0` = 成功；非零值等于 HTTP 状态码      |
| `message` | string | 成功时为 `"ok"`，失败时为具体错误说明   |
| `data`    | any    | 业务数据，失败时为 `null`               |

> **前端 Next.js 代理层**会自动拆包，客户端组件直接收到 `data` 字段的内容，无需手动解析信封。

---

## 1. 用户模块

### 1.1 注册

```
POST /api/v1/user/register
Content-Type: application/json

Request:
{
  "username": "张三",
  "email": "user@example.com",
  "password": "Abc12345"
}

Response 200 — data:
{
  "token": "eyJhbGci...",
  "user": { "id": 1, "username": "张三", "email": "user@example.com" }
}

Response 400:
{ "code": 400, "message": "邮箱已被注册", "data": null }
```

### 1.2 登录

```
POST /api/v1/user/login
Content-Type: application/json

Request:
{
  "email": "user@example.com",
  "password": "Abc12345"
}

Response 200 — data:
{
  "token": "eyJhbGci...",
  "user": { "id": 1, "username": "张三", "email": "user@example.com" }
}

Response 401:
{ "code": 401, "message": "邮箱或密码错误", "data": null }
```

### 1.3 获取当前用户信息

```
GET /api/v1/user/me
Authorization: Bearer <token>

Response 200 — data:
{
  "id": 1,
  "username": "张三",
  "email": "user@example.com",
  "createdAt": "2026-04-01"
}
```

---

## 2. 笔记模块

### 2.1 获取笔记列表

```
GET /api/v1/notes
Authorization: Bearer <token>

Response 200 — data:
[
  { "id": "note-abc123", "name": "人工智能导论", "createdAt": "2026-04-01", "nodeCount": 8 }
]
```

### 2.2 删除笔记

```
DELETE /api/v1/notes/:noteId
Authorization: Bearer <token>

Response 200 — data: null
```

### 2.3 获取图谱数据

```
GET /api/v1/graph?noteId=note-abc123
Authorization: Bearer <token>

Response 200 — data:
{
  "nodes": [
    { "id": "n1", "name": "人工智能", "type": "concept", "description": "..." }
  ],
  "links": [
    { "source": "n1", "target": "n2", "relationship": "包含" }
  ]
}

Response 404:
{ "code": 404, "message": "未找到对应图谱", "data": null }
```

---

## 3. AI 解析模块

### 3.1 上传文档（异步解析）

```
POST /api/v1/ai/parse-document
Authorization: Bearer <token>
Content-Type: multipart/form-data

Request (form-data):
  file:     <二进制文件>       # PDF / Word / TXT，最大 100MB
  noteName: "人工智能导论"

Response 200 — data:
{ "jobId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" }

Response 400:
{ "code": 400, "message": "不支持的文件类型", "data": null }

Response 413:
{ "code": 413, "message": "文件超过 100MB 限制", "data": null }
```

### 3.2 查询解析任务状态

```
GET /api/v1/ai/parse-status/:jobId
Authorization: Bearer <token>

Response 200 — data:
{
  "jobId": "...",
  "status": "PROCESSING",     # PENDING | PROCESSING | DONE | FAILED
  "progress": 45,             # 0-100
  "stage": "正在提取实体关系",
  "fileName": "report.pdf",
  "noteId": null,             # 仅 DONE 时有值
  "errorMessage": null        # 仅 FAILED 时有值
}
```

### 3.3 查询用户所有进行中任务

```
GET /api/v1/ai/parse-status/pending
Authorization: Bearer <token>

Response 200 — data: [ <ParseJobStatus>, ... ]
```

### 3.4 AI 问答（流式 SSE）

```
POST /api/v1/ai/chat
Authorization: Bearer <token>
Content-Type: application/json

Request:
{
  "noteId": "note-abc123",
  "question": "机器学习和深度学习的关系是什么？"
}

Response: text/event-stream（不套 Result 信封）
data: 机器
data: 学习
data: ...
data: [DONE]
```

---

## 4. 分享模块

### 4.1 创建分享链接

```
POST /api/v1/notes/:noteId/share
Authorization: Bearer <token>
Content-Type: application/json

Request:
{ "permission": "view" }    # view | edit

Response 200 — data:
{
  "shareCode": "abc123xyz",
  "shareUrl": "https://yourdomain.com/share/abc123xyz",
  "permission": "view"
}
```

### 4.2 通过分享码获取图谱（无需登录）

```
GET /api/v1/share/:shareCode

Response 200 — data:
{
  "noteName": "人工智能导论",
  "permission": "view",
  "graph": { "nodes": [...], "links": [...] }
}

Response 404:
{ "code": 404, "message": "分享链接不存在或已失效", "data": null }
```

---

## 5. 错误码规范

| HTTP 状态码 | `code` 值 | 含义                    |
|-------------|-----------|-------------------------|
| 200         | 0         | 成功                    |
| 400         | 400       | 参数错误                |
| 401         | 401       | 未登录或 Token 过期     |
| 403         | 403       | 无权限访问              |
| 404         | 404       | 资源不存在              |
| 413         | 413       | 文件过大                |
| 500         | 500       | 服务器内部错误          |

---

## 6. CORS 配置要求（后端必须配置）

后端需允许前端域名跨域访问：
- 开发环境：`http://localhost:3000`
- 生产环境：`https://your-vercel-domain.vercel.app`

允许的 Headers：`Authorization, Content-Type`  
允许的 Methods：`GET, POST, PUT, DELETE, OPTIONS`
