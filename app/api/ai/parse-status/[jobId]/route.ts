import { NextRequest, NextResponse } from "next/server";
import { unwrapResult } from "@/lib/proxy";

const JAVA = process.env.JAVA_API_BASE ?? "http://localhost:8080";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await params;
  const token = request.headers.get("authorization") ?? "";

  const res = await fetch(`${JAVA}/api/v1/ai/parse-status/${jobId}`, {
    headers: { authorization: token },
    cache: "no-store",
  });

  const { body, status } = await unwrapResult(res);
  return NextResponse.json(body, { status });
}
