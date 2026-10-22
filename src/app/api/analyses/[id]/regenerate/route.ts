import { NextResponse } from "next/server";
import { getJob, regenerate } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const job = getJob(id);

  if (!job || !job.result) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Analysis not found.", retryable: false } },
      { status: 404 }
    );
  }

  regenerate(id);

  return NextResponse.json(
    {
      ok: true,
      markdown: job.result.markdown,
      discardedEdits: true,
    },
    { headers: { "cache-control": "no-store" } }
  );
}
