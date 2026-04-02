import { NextRequest, NextResponse } from "next/server";
import { unwrapResult } from "@/lib/proxy";

const JAVA = process.env.JAVA_API_BASE ?? "http://localhost:8080";

/** 无需鉴权，任何人持 code 可访问 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;

  const res = await fetch(`${JAVA}/api/v1/share/${code}`, {
    cache: "no-store",
  });

  const { body, status } = await unwrapResult(res);
  return NextResponse.json(body, { status });
}
