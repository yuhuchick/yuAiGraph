import { NextRequest, NextResponse } from "next/server";

const JAVA = process.env.JAVA_API_BASE ?? "http://localhost:8080";

export async function POST(request: NextRequest) {
  const body = await request.json() as { noteId?: string; question?: string };

  if (!body.question?.trim()) {
    return NextResponse.json({ message: "问题不能为空" }, { status: 400 });
  }

  const token = request.headers.get("authorization") ?? "";

  const res = await fetch(`${JAVA}/api/v1/ai/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authorization: token,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok || !res.body) {
    return NextResponse.json({ message: "AI 服务暂时不可用" }, { status: 502 });
  }

  // Java 端以 SSE 格式推送（data: 内容\n\n），此处剥掉前缀转为纯文本流
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let buffer = "";
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data:")) continue;
            const data = line.slice(5).trim();
            if (data === "[DONE]") {
              controller.close();
              return;
            }
            if (data) {
              controller.enqueue(encoder.encode(data));
            }
          }
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
      // 告知 Nginx / Vercel Edge 不要缓冲，实时透传
      "X-Accel-Buffering": "no",
      "Cache-Control": "no-cache",
    },
  });
}
