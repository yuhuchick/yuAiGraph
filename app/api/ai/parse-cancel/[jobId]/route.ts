import { NextRequest, NextResponse } from "next/server";
import { unwrapResult } from "@/lib/proxy";

const JAVA = process.env.JAVA_API_BASE ?? "http://localhost:8080";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await context.params;
  const token = request.headers.get("authorization") ?? "";

  const res = await fetch(`${JAVA}/api/v1/ai/parse-cancel/${encodeURIComponent(jobId)}`, {
    method: "POST",
    headers: { authorization: token },
  });

  const { body, status } = await unwrapResult(res);
  return NextResponse.json(body, { status });
}
