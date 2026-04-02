import { NextRequest, NextResponse } from "next/server";
import { unwrapResult } from "@/lib/proxy";

export async function POST(request: NextRequest) {
  // ── Mock 模式：模拟 1.5s 解析，返回固定 jobId ─────────────
  if (!process.env.JAVA_API_BASE) {
    await new Promise((r) => setTimeout(r, 1500));
    return NextResponse.json({ jobId: "mock-job-1" });
  }

  // ── 真实模式：透传 FormData 到 Java 后端 ───────────────────
  const token = request.headers.get("authorization") ?? "";
  const formData = await request.formData();

  const res = await fetch(
    `${process.env.JAVA_API_BASE}/api/v1/ai/parse-document`,
    {
      method: "POST",
      headers: { authorization: token },
      body: formData,
    },
  );

  const { body, status } = await unwrapResult(res);
  return NextResponse.json(body, { status });
}
