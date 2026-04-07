import { NextRequest, NextResponse } from "next/server";
import { unwrapResult } from "@/lib/proxy";

const JAVA = process.env.JAVA_API_BASE ?? "http://localhost:8080";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ noteId: string }> },
) {
  const { noteId } = await params;
  const token = request.headers.get("authorization") ?? "";
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "请求体须为合法 JSON" }, { status: 400 });
  }

  const res = await fetch(`${JAVA}/api/v1/notes/${noteId}/share`, {
    method: "POST",
    headers: { "Content-Type": "application/json", authorization: token },
    body: JSON.stringify(body),
  });

  const { body: payload, status } = await unwrapResult(res);
  return NextResponse.json(payload, { status });
}
