import { NextRequest, NextResponse } from "next/server";
import { unwrapResult } from "@/lib/proxy";

const JAVA = process.env.JAVA_API_BASE ?? "http://localhost:8080";

export async function POST(request: NextRequest) {
  const body = await request.json();

  const res = await fetch(`${JAVA}/api/v1/user/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const { body: payload, status } = await unwrapResult(res);
  return NextResponse.json(payload, { status });
}
