import { NextRequest, NextResponse } from "next/server";
import { unwrapResult } from "@/lib/proxy";

const JAVA = process.env.JAVA_API_BASE ?? "http://localhost:8080";

export async function GET(request: NextRequest) {
  const token = request.headers.get("authorization") ?? "";
  const qs = request.nextUrl.searchParams.toString();
  const suffix = qs ? `?${qs}` : "";

  const res = await fetch(`${JAVA}/api/v1/admin/users${suffix}`, {
    headers: { authorization: token },
    cache: "no-store",
  });

  const { body, status } = await unwrapResult(res);
  return NextResponse.json(body, { status });
}

export async function POST(request: NextRequest) {
  const token = request.headers.get("authorization") ?? "";
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "请求体须为合法 JSON" }, { status: 400 });
  }

  const res = await fetch(`${JAVA}/api/v1/admin/users`, {
    method: "POST",
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
