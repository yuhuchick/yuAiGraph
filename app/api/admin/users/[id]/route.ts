import { NextRequest, NextResponse } from "next/server";
import { unwrapResult } from "@/lib/proxy";

const JAVA = process.env.JAVA_API_BASE ?? "http://localhost:8080";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const token = request.headers.get("authorization") ?? "";
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "请求体须为合法 JSON" }, { status: 400 });
  }

  const res = await fetch(`${JAVA}/api/v1/admin/users/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: {
      authorization: token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const { body: payload, status } = await unwrapResult(res);
  return NextResponse.json(payload, { status });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const token = request.headers.get("authorization") ?? "";

  const res = await fetch(`${JAVA}/api/v1/admin/users/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { authorization: token },
    cache: "no-store",
  });

  const { body, status } = await unwrapResult(res);
  return NextResponse.json(body ?? {}, { status });
}
