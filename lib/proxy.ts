/**
 * Next.js 代理路由的 Result<T> 拆包工具。
 *
 * Java 后端统一返回:
 *   { "code": 0,      "message": "ok",  "data": <T> }   // 成功
 *   { "code": <4xx>,  "message": "...", "data": null }   // 失败
 *
 * 本函数将 data 拆出来直接透传给前端客户端，
 * 失败时透传 { message } 以保持现有错误处理不变。
 */

interface ApiResult {
  code: number;
  message: string;
  data: unknown;
}

export async function unwrapResult(
  res: Response,
): Promise<{ body: unknown; status: number }> {
  const result = (await res.json()) as ApiResult;

  if (res.ok) {
    return { body: result.data ?? null, status: 200 };
  }

  return {
    body: { message: result.message ?? `请求失败 (${res.status})` },
    status: res.status,
  };
}
