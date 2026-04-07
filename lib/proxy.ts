/**
 * Next.js 代理路由的 Result<T> 拆包工具。
 *
 * Java 后端统一返回:
 *   { "code": 0,      "message": "ok",  "data": <T> }   // 成功
 *   { "code": <4xx>,  "message": "...", "data": null }   // 失败
 *
 * 成功时返回 data 与上游 HTTP 状态码（一般为 200）；
 * 失败时返回 { message } 与上游 4xx/5xx，便于前端区分 400/401/403/404。
 */

interface ApiResult {
  code: number;
  message: string;
  data: unknown;
}

export async function unwrapResult(
  res: Response,
): Promise<{ body: unknown; status: number }> {
  const text = await res.text();
  const status = res.status;

  if (!text.trim()) {
    if (res.ok) {
      return { body: null, status };
    }
    return {
      body: { message: `请求失败 (${status})` },
      status,
    };
  }

  let result: ApiResult;
  try {
    result = JSON.parse(text) as ApiResult;
  } catch {
    return {
      body: {
        message: res.ok
          ? "服务器返回了非 JSON 数据"
          : text.slice(0, 200) || `请求失败 (${status})`,
      },
      status: res.ok ? 200 : status,
    };
  }

  if (res.ok) {
    return { body: result.data ?? null, status };
  }

  return {
    body: { message: result.message ?? `请求失败 (${status})` },
    status,
  };
}
