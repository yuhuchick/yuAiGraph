import { NextRequest, NextResponse } from "next/server";
import { unwrapResult } from "@/lib/proxy";

const JAVA = process.env.JAVA_API_BASE ?? "http://localhost:8080";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "请求体须为合法 JSON" }, { status: 400 });
  }

  const res = await fetch(`${JAVA}/api/v1/user/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const { body: payload, status } = await unwrapResult(res);
  return NextResponse.json(payload, { status });
}
