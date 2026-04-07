import { NextRequest, NextResponse } from "next/server";
import { unwrapResult } from "@/lib/proxy";

const JAVA = process.env.JAVA_API_BASE ?? "http://localhost:8080";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ noteId: string }> },
) {
  const { noteId } = await params;
  const token = request.headers.get("authorization") ?? "";

  const res = await fetch(`${JAVA}/api/v1/notes/${encodeURIComponent(noteId)}`, {
    method: "DELETE",
    headers: { authorization: token },
    cache: "no-store",
  });

  const { body, status } = await unwrapResult(res);
  return NextResponse.json(body, { status });
}
